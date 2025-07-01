// --- Pomodoro Timer ---
// Основные DOM-элементы
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const timerDisplay = document.getElementById("timer");
const taskMenu = document.getElementById("task-menu");
const customTask = document.getElementById("custom-task");
const menuTrigger = document.querySelector(".menu-trigger");
const customAlert = document.getElementById("custom-alert");
const alertClose = document.querySelector(".alert-close");
const timerSound = document.getElementById("timerSound");

// --- Timer Class ---
class Timer {
  constructor(display, sound, onFinish) {
    this.display = display;
    this.sound = sound;
    this.onFinish = onFinish;
    this.defaultMinutes = 25;
    this.minutes = this.defaultMinutes;
    this.seconds = 0;
    this.timerId = null;
    this.startTime = null;
    this.totalSeconds = this.defaultMinutes * 60;
  }
  formatTime(minutes, seconds) {
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  updateDisplay(animated = true) {
    const formatted = this.formatTime(this.minutes, this.seconds);
    if (animated) {
      this.display.innerHTML = `<span class="new">${formatted}</span>`;
      this.display.classList.add("animate");
      setTimeout(() => {
        this.display.classList.remove("animate");
        this.display.innerHTML = `<span>${formatted}</span>`;
      }, 500);
    } else {
      this.display.innerHTML = `<span>${formatted}</span>`;
    }
  }
  start(currentTask) {
    if (this.timerId) this.stop();
    this.startTime = Date.now();
    this.totalSeconds = this.minutes * 60 + this.seconds;
    this.timerId = setInterval(() => this.tick(currentTask), 1000);
    this.saveState(currentTask);
  }
  tick(currentTask) {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const remaining = Math.max(0, this.totalSeconds - elapsed);
    this.minutes = Math.floor(remaining / 60);
    this.seconds = remaining % 60;
    this.updateDisplay();
    this.saveState(currentTask);
    if (remaining === 0) {
      this.stop();
      this.display.innerHTML = '<span>00:00</span>';
      this.sound.play();
      if (this.onFinish) this.onFinish();
    }
  }
  stop() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
    this.saveState();
  }
  reset() {
    this.stop();
    this.minutes = this.defaultMinutes;
    this.seconds = 0;
    this.startTime = null;
    this.totalSeconds = this.defaultMinutes * 60;
    this.updateDisplay(false);
    this.saveState();
  }
  saveState(currentTask) {
    localStorage.setItem('timerState', JSON.stringify({
      minutes: this.minutes,
      seconds: this.seconds,
      running: !!this.timerId,
      startTime: this.startTime,
      totalSeconds: this.totalSeconds,
      currentTask: currentTask || ''
    }));
  }
  restoreState() {
    const state = JSON.parse(localStorage.getItem('timerState'));
    if (state) {
      this.minutes = state.minutes;
      this.seconds = state.seconds;
      this.startTime = state.startTime;
      this.totalSeconds = state.totalSeconds;
      this.updateDisplay(false);
    }
    return state;
  }
}

// --- Tasks Class ---
class Tasks {
  constructor(menu, customInput, menuTrigger, onTaskChange) {
    this.menu = menu;
    this.customInput = customInput;
    this.menuTrigger = menuTrigger;
    this.onTaskChange = onTaskChange;
    this.currentTask = '';
    this.init();
  }
  init() {
    this.menu.querySelectorAll(".menu-item > a").forEach(item => {
      item.addEventListener("click", e => {
        e.preventDefault();
        const task = item.textContent;
        if (task === "ЛУЧШЕ ВАМ НЕ ЗНАТЬ (ВВЕДИ СПРАВА)") {
          this.customInput.disabled = false;
          this.customInput.focus();
          this.menuTrigger.textContent = "ПИШИ ЧД ТУТ";
          if (!this.customInput.value.trim()) {
            if (this.onTaskChange) this.onTaskChange('');
          }
        } else {
          this.currentTask = task;
          this.customInput.disabled = true;
          this.customInput.value = "";
          this.menuTrigger.textContent = task;
          if (this.onTaskChange) this.onTaskChange(task);
        }
        this.menu.querySelector(".menu-list").style.visibility = "hidden";
        this.menu.querySelector(".menu-list").style.opacity = "0";
        this.saveTask();
      });
    });
    this.customInput.addEventListener("input", () => {
      this.currentTask = this.customInput.value || "";
      this.menuTrigger.textContent = this.currentTask || "ПИШИ ЧД ТУТ";
      if (this.onTaskChange) this.onTaskChange(this.currentTask);
      this.saveTask();
    });
    this.menu.addEventListener("mouseenter", () => {
      const menuList = this.menu.querySelector(".menu-list");
      menuList.style.visibility = "visible";
      menuList.style.opacity = "1";
      menuList.style.transform = "translateY(0)";
    });
    this.menu.addEventListener("mouseleave", () => {
      const menuList = this.menu.querySelector(".menu-list");
      menuList.style.visibility = "hidden";
      menuList.style.opacity = "0";
      menuList.style.transform = "translateY(10px)";
    });
    this.restoreTask();
    if (!this.currentTask) {
      this.menuTrigger.textContent = "Выбери задачу";
    }
  }
  saveTask() {
    localStorage.setItem('currentTask', this.currentTask);
  }
  restoreTask() {
    const task = localStorage.getItem('currentTask');
    if (task) {
      this.currentTask = task;
      if (this.menuTrigger) this.menuTrigger.textContent = task;
      if (this.customInput) {
        this.customInput.value = task;
        this.customInput.disabled = task !== '';
      }
      if (this.onTaskChange) this.onTaskChange(task);
    }
  }
}

// --- Alert Class ---
class Alert {
  constructor(alertEl, closeBtn) {
    this.alertEl = alertEl;
    this.closeBtn = closeBtn;
    this.closeBtn.addEventListener('click', () => this.hide());
  }
  show(message) {
    this.alertEl.style.display = "flex";
    this.alertEl.querySelector(".alert-text").textContent = message;
    this.alertEl.setAttribute('aria-live', 'assertive');
  }
  hide() {
    this.alertEl.style.display = "none";
  }
}

// --- Инициализация ---
const timer = new Timer(timerDisplay, timerSound, () => {
  alertBox.show('ВРЕМЯ ВЫШЛО!');
});
const tasks = new Tasks(taskMenu, customTask, menuTrigger, (task) => {
  document.querySelectorAll('.menu-item > a').forEach(a => {
    a.classList.toggle('active', a.textContent === task);
  });
});
const alertBox = new Alert(customAlert, alertClose);

// Восстановление состояния
const timerState = timer.restoreState();
if (timerState && timerState.currentTask) {
  tasks.currentTask = timerState.currentTask;
  tasks.menuTrigger.textContent = timerState.currentTask;
}

// --- Кнопки ---
startBtn.addEventListener("click", function() {
  if (timer.timerId === null) {
    if (customTask.disabled === false && !customTask.value.trim()) {
      alertBox.show("Введите задачу перед стартом!");
      return;
    }
    startBtn.textContent = "СТОП";
    resetBtn.disabled = false;
    timer.start(tasks.currentTask);
  } else {
    timer.stop();
    startBtn.textContent = "ЧЕГО ЖДЁШЬ?";
    resetBtn.disabled = false;
  }
});

resetBtn.addEventListener("click", function() {
  timer.reset();
  startBtn.textContent = "ЧЕГО ЖДЁШЬ?";
  resetBtn.disabled = true;
  tasks.currentTask = "";
  customTask.disabled = true;
  customTask.value = "";
  menuTrigger.textContent = "Выбери задачу";
  document.querySelectorAll('.menu-item > a').forEach(a => a.classList.remove('active'));
  localStorage.removeItem('currentTask');
});

// --- Доступность ---
customAlert.setAttribute('role', 'alertdialog');
customAlert.setAttribute('aria-modal', 'true');
timerDisplay.setAttribute('aria-live', 'polite');

// --- Сброс состояния при загрузке ---
window.addEventListener('DOMContentLoaded', () => {
  localStorage.clear();
});
