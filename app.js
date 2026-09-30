const KEY = "arc-habits-v3";
const REMINDER_KEY = "arc-reminders-v1";

const defaults = {
  date: null,
  prayers: {
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false
  },
  habits: {
    workout: false,
    junk: false,
    healthy: false
  },
  steps: 0,
  water: 0,
  learning: 0,
  productive: 0,
  sleep: 0,
  history: {},
  goals: []
};

const PRAYER_REMINDERS = [
  { name: "Fajr", time: "05:30" },
  { name: "Dhuhr", time: "13:00" },
  { name: "Asr", time: "17:00" },
  { name: "Maghrib", time: "18:30" },
  { name: "Isha", time: "20:00" }
];

const REMINDER_DEFAULTS = {
  namaaz: true,
  water: true,
  workout: false,
  sleep: true
};

let state = load();
let analyticsTab = "week";

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));

    if (!saved) {
      return structuredClone(defaults);
    }

    return {
      ...structuredClone(defaults),
      ...saved,
      prayers: {
        ...defaults.prayers,
        ...(saved.prayers || {})
      },
      habits: {
        ...defaults.habits,
        ...(saved.habits || {})
      },
      history: saved.history || {},
      goals: saved.goals || []
    };
  } catch {
    return structuredClone(defaults);
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function getReminders() {
  try {
    return {
      ...REMINDER_DEFAULTS,
      ...(JSON.parse(localStorage.getItem(REMINDER_KEY)) || {})
    };
  } catch {
    return { ...REMINDER_DEFAULTS };
  }
}

function saveReminders(reminders) {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
}

function dateKey(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function today() {
  return dateKey();
}

function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    m =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[m])
  );
}

function toast(msg) {
  const t = document.querySelector("#toast");

  if (!t) return;

  t.textContent = msg;
  t.classList.add("show");

  setTimeout(() => {
    t.classList.remove("show");
  }, 1800);
}

function pct() {
  const prayerDone =
    Object.values(state.prayers).filter(Boolean).length / 5;

  const fixed = [
    state.habits.workout,
    state.steps >= 10000,
    state.water >= 3,
    state.habits.junk,
    state.habits.healthy,
    state.learning >= 60,
    state.productive >= 240,
    state.sleep >= 7
  ].filter(Boolean).length / 8;

  return Math.round(((prayerDone + fixed) / 2) * 100);
}

function persistToday() {
  state.history[today()] = {
    pct: pct(),
    prayers: { ...state.prayers },
    habits: { ...state.habits },
    steps: state.steps,
    water: state.water,
    learning: state.learning,
    productive: state.productive,
    sleep: state.sleep
  };

  save();
}

function formatHours(x) {
  const h = Math.floor(Number(x) || 0);
  const m = Math.round(((Number(x) || 0) - h) * 60);

  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/* =========================
   MAIN RENDER
========================= */

function render() {
  document.querySelector("#todayLabel").textContent =
    new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(new Date());

  const h = new Date().getHours();

  document.querySelector("#greeting").textContent =
    (h < 12
      ? "Good morning"
      : h < 18
      ? "Good afternoon"
      : "Good evening") + " 👋";

  renderHome();
  renderProgress();
  renderGoals();
  renderHistory();
  renderSettings();
}

/* =========================
   HOME
========================= */

function renderHome() {
  const p = pct();

  const prayerDone =
    Object.values(state.prayers).filter(Boolean).length;

  const prayerNames = Object.keys(state.prayers);

  document.querySelector("#screen-home").innerHTML = `
    <div class="card progress-card">
      <div class="ring" style="--p:${p}%">
        <div class="ring-content">
          <strong>${p}%</strong>
          <span>today</span>
        </div>
      </div>

      <div class="streak">
        <strong>🔥 ${calculateStreak()} days</strong>
        <span>current streak</span>

        <div style="height:12px"></div>

        <span>Consistency over intensity.</span>
      </div>
    </div>

    <div class="section-label">DEEN</div>

    <div class="card">
      <div class="card-title">
        <h2>Namaaz</h2>
        <span class="sub">${prayerDone}/5</span>
      </div>

      <div class="prayers">
        ${prayerNames
          .map(
            n => `
              <button
                class="prayer ${state.prayers[n] ? "done" : ""}"
                data-prayer="${n}"
              >
                <span class="check">
                  ${state.prayers[n] ? "✓" : "○"}
                </span>
                <small>${n}</small>
              </button>
            `
          )
          .join("")}
      </div>
    </div>

    <div class="section-label">QUICK STATS</div>

    <div class="card">
      <div class="quick-grid">

        <div class="quick">
          <b>${(state.steps / 1000).toFixed(1)}k</b>
          <small>Steps</small>
        </div>

        <div class="quick">
          <b>${Number(state.water).toFixed(1)}L</b>
          <small>Water</small>
        </div>

        <div class="quick">
          <b>${formatHours(state.sleep)}</b>
          <small>Sleep</small>
        </div>

      </div>
    </div>

    <div class="section-label">TODAY'S HABITS</div>

    <div class="card">

      ${metric(
        "🏋️",
        "Workout",
        state.habits.workout ? "Completed" : "Not done",
        state.habits.workout ? 100 : 0,
        "workout"
      )}

      ${metric(
        "👟",
        "Steps",
        `${state.steps.toLocaleString()} / 10,000`,
        Math.min(100, (state.steps / 10000) * 100),
        "steps",
        true
      )}

      ${metric(
        "💧",
        "Water",
        `${Number(state.water).toFixed(1)}L / 3L`,
        Math.min(100, (state.water / 3) * 100),
        "water",
        true
      )}

      ${metric(
        "🍽️",
        "No Junk Food",
        state.habits.junk ? "On track" : "Missed",
        state.habits.junk ? 100 : 0,
        "junk"
      )}

      ${metric(
        "🥗",
        "Healthy Meals",
        state.habits.healthy ? "On track" : "Missed",
        state.habits.healthy ? 100 : 0,
        "healthy"
      )}

      ${metric(
        "📚",
        "Read / Learn",
        `${state.learning} / 60 min`,
        Math.min(100, (state.learning / 60) * 100),
        "learning",
        true
      )}

      ${metric(
        "🎯",
        "Productive Work",
        `${Math.floor(state.productive / 60)}h ${
          state.productive % 60
        }m / 4h`,
        Math.min(100, (state.productive / 240) * 100),
        "productive",
        true
      )}

    </div>

    <div class="card">

      <div class="card-title">
        <h2>😴 Sleep</h2>
        <button class="action" id="sleepEdit">Edit</button>
      </div>

      <div style="font-size:12px;color:var(--muted)">
        Last night
      </div>

      <div style="font-size:24px;font-weight:800;margin:5px 0">
        ${formatHours(state.sleep)}
      </div>

      <div class="sub">
        Target 7–9h
      </div>

    </div>
  `;

  /* Prayer */

  document.querySelectorAll("[data-prayer]").forEach(btn => {
    btn.onclick = () => {
      const name = btn.dataset.prayer;

      state.prayers[name] = !state.prayers[name];

      persistToday();
      render();
    };
  });

  /* Habits */

  document.querySelectorAll("[data-habit]").forEach(btn => {
    btn.onclick = () => {
      const habit = btn.dataset.habit;

      state.habits[habit] = !state.habits[habit];

      persistToday();
      render();
    };
  });

  document.querySelector("#sleepEdit").onclick = openSleep;

  /* Numeric Inputs */

  document.querySelectorAll("[data-input]").forEach(input => {
    input.addEventListener("change", () => {
      const key = input.dataset.input;
      const value = Number(input.value);

      if (Number.isNaN(value) || value < 0) return;

      state[key] = value;

      persistToday();
      render();
    });
  });
}

function metric(
  icon,
  name,
  value,
  width,
  key,
  input = false
) {
  const clickable = ["workout", "junk", "healthy"].includes(key);

  if (input) {
    let step = "1";
    let min = "0";

    if (key === "water") step = "0.1";

    return `
      <div class="metric">

        <span class="icon">${icon}</span>

        <div style="flex:1">

          <div class="metric-name">${name}</div>

          <div style="display:flex;gap:8px;align-items:center;margin-top:4px">

            <input
              class="input"
              data-input="${key}"
              type="number"
              min="${min}"
              step="${step}"
              value="${state[key]}"
              style="max-width:130px"
            >

          </div>

          <div class="bar">
            <i style="--w:${width}%"></i>
          </div>

        </div>

        <span class="metric-check">
          ${width >= 100 ? "✓" : "›"}
        </span>

      </div>
    `;
  }

  return `
    <div
      class="metric"
      ${
        clickable
          ? `data-habit="${key}" style="cursor:pointer"`
          : ""
      }
    >

      <span class="icon">${icon}</span>

      <div>
        <div class="metric-name">${name}</div>
        <div class="metric-value">${value}</div>

        <div class="bar">
          <i style="--w:${width}%"></i>
        </div>
      </div>

      <span class="metric-check">
        ${width >= 100 ? "✓" : "›"}
      </span>

    </div>
  `;
}

/* =========================
   PROGRESS
========================= */

function renderProgress() {
  const vals = analyticsData(analyticsTab);

  const avg =
    vals.length > 0
      ? Math.round(
          vals.reduce((a, b) => a + b.p, 0) / vals.length
        )
      : 0;

  document.querySelector("#screen-progress").innerHTML = `

    <div class="card-title">
      <h2 style="font-size:22px">Progress</h2>
      <span class="sub">Analytics</span>
    </div>

    <div class="tabs">

      ${["day", "week", "month"]
        .map(
          x => `
            <button
              class="tab ${analyticsTab === x ? "active" : ""}"
              data-tab="${x}"
            >
              ${x[0].toUpperCase() + x.slice(1)}
            </button>
          `
        )
        .join("")}

    </div>

    <div class="card progress-card">

      <div class="ring" style="--p:${avg}%">

        <div class="ring-content">
          <strong>${avg}%</strong>
          <span>completion</span>
        </div>

      </div>

      <div class="streak">

        <strong>🔥 ${calculateStreak()} days</strong>
        <span>current streak</span>

        <div style="height:12px"></div>

        <span>
          Your consistency is tracked automatically.
        </span>

      </div>

    </div>

    <div class="card">

      <div class="card-title">
        <h2>
          ${
            analyticsTab === "day"
              ? "Today's Completion"
              : analyticsTab === "week"
              ? "Weekly Completion"
              : "Monthly Trend"
          }
        </h2>

        <span class="sub">${analyticsTab}</span>
      </div>

      <div class="chart">

        ${vals
          .map(
            v => `
              <div class="bar-col">

                <i style="height:${Math.max(
                  4,
                  v.p
                )}%"></i>

                <small>${v.label}</small>

              </div>
            `
          )
          .join("")}

      </div>

    </div>

    <div class="stat-grid">

      <div class="stat">
        <strong>${state.steps.toLocaleString()}</strong>
        <small>Steps today</small>
      </div>

      <div class="stat">
        <strong>${Number(state.water).toFixed(1)}L</strong>
        <small>Water today</small>
      </div>

      <div class="stat">
        <strong>${formatHours(state.sleep)}</strong>
        <small>Sleep</small>
      </div>

      <div class="stat">
        <strong>${state.learning}m</strong>
        <small>Learning</small>
      </div>

    </div>

    <div class="card">

      <div class="card-title">
        <h2>Habit Consistency</h2>
        <span class="sub">Logged data</span>
      </div>

      ${consistencyMetric(
        "🕌",
        "Namaaz",
        calculatePrayerConsistency()
      )}

      ${consistencyMetric(
        "🏋️",
        "Workout",
        calculateHabitConsistency("workout")
      )}

      ${consistencyMetric(
        "👟",
        "Steps",
        calculateTargetConsistency("steps")
      )}

      ${consistencyMetric(
        "💧",
        "Water",
        calculateTargetConsistency("water")
      )}

      ${consistencyMetric(
        "📚",
        "Learning",
        calculateTargetConsistency("learning")
      )}

      ${consistencyMetric(
        "😴",
        "Sleep",
        calculateTargetConsistency("sleep")
      )}

    </div>
  `;

  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.onclick = () => {
      analyticsTab = btn.dataset.tab;
      renderProgress();
    };
  });
}

function consistencyMetric(icon, name, value) {
  return `
    <div class="metric">

      <span class="icon">${icon}</span>

      <div style="flex:1">

        <div class="metric-name">${name}</div>

        <div class="bar">
          <i style="--w:${value}%"></i>
        </div>

      </div>

      <span class="metric-value">
        ${value}%
      </span>

    </div>
  `;
}

function analyticsData(tab) {
  const history = Object.entries(state.history)
    .sort(([a], [b]) => a.localeCompare(b));

  if (tab === "day") {
    return [
      {
        label: "Today",
        p: pct()
      }
    ];
  }

  if (tab === "week") {
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();

      d.setDate(d.getDate() - i);

      const key = dateKey(d);

      result.push({
        label: d.toLocaleDateString("en-IN", {
          weekday: "short"
        }),
        p: state.history[key]?.pct || 0
      });
    }

    return result;
  }

  const result = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();

    d.setDate(d.getDate() - i);

    const key = dateKey(d);

    result.push({
      label: d.getDate(),
      p: state.history[key]?.pct || 0
    });
  }

  return result;
}

/* =========================
   GOALS
========================= */

function renderGoals() {
  document.querySelector("#screen-goals").innerHTML = `

    <div class="card-title">

      <h2 style="font-size:22px">
        Goals
      </h2>

      <button
        class="action primary"
        id="addGoal"
      >
        + Add
      </button>

    </div>

    <div class="card">

      <div class="card-title">
        <h2>Monthly Goals</h2>
        <span class="sub">Personal</span>
      </div>

      ${
        state.goals.length
          ? state.goals
              .map(
                g => `
                  <div class="goal">

                    <div class="goal-head">
                      <b>${esc(g.name)}</b>
                      <span>${g.p}%</span>
                    </div>

                    <p>${esc(g.desc || "")}</p>

                    <div class="bar">
                      <i style="--w:${g.p}%"></i>
                    </div>

                  </div>
                `
              )
              .join("")
          : `
            <div style="padding:20px 0;text-align:center;color:var(--muted)">
              No goals yet.<br>
              Add your first goal.
            </div>
          `
      }

    </div>

    <div class="card">

      <div class="card-title">
        <h2>Goal Habits</h2>
      </div>

      ${[
        ["🏋️", "Workout"],
        ["👟", "Steps"],
        ["💧", "Water"],
        ["📚", "Learning"],
        ["😴", "Sleep"]
      ]
        .map(
          x => `
            <div class="setting">
              <span>${x[0]} ${x[1]}</span>
              <span class="sub">›</span>
            </div>
          `
        )
        .join("")}

    </div>
  `;

  document.querySelector("#addGoal").onclick = openGoal;
}

/* =========================
   HISTORY
========================= */

function renderHistory() {
  const now = new Date();

  const y = now.getFullYear();
  const m = now.getMonth();

  const first = new Date(y, m, 1);

  const days = new Date(
    y,
    m + 1,
    0
  ).getDate();

  const start =
    (first.getDay() + 6) % 7;

  let cells = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun"
  ]
    .map(x => `<div class="dayname">${x}</div>`)
    .join("");

  for (let i = 0; i < start; i++) {
    cells += `<div></div>`;
  }

  for (let d = 1; d <= days; d++) {
    const k = dateKey(new Date(y, m, d));

    const has =
      state.history[k]?.pct >= 70;

    cells += `
      <div
        class="day ${has ? "has" : ""} ${
          d === now.getDate() ? "today" : ""
        }"
        data-day="${k}"
      >
        ${d}
      </div>
    `;
  }

  const monthName = now.toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric"
    }
  );

  document.querySelector("#screen-history").innerHTML = `

    <div class="card-title">

      <h2 style="font-size:22px">
        History
      </h2>

      <span class="sub">
        ${monthName}
      </span>

    </div>

    <div class="card">

      <div class="calendar">
        ${cells}
      </div>

    </div>

    <div class="card">

      <div class="card-title">
        <h2>Monthly Reflection</h2>
      </div>

      <div class="stat-grid">

        <div class="stat">
          <strong>${calculateMonthlyAverage()}%</strong>
          <small>Consistency</small>
        </div>

        <div class="stat">
          <strong>${calculateBestStreak()}d</strong>
          <small>Best streak</small>
        </div>

        <div class="stat">
          <strong>${calculateCompletedDays()}</strong>
          <small>Days logged</small>
        </div>

        <div class="stat">
          <strong>${formatHours(
            calculateAverageSleep()
          )}</strong>
          <small>Avg. sleep</small>
        </div>

      </div>

    </div>
  `;

  document.querySelectorAll("[data-day]").forEach(btn => {
    btn.onclick = () => {
      const data =
        state.history[btn.dataset.day];

      toast(
        `${btn.dataset.day}: ${
          data?.pct || 0
        }% completion`
      );
    };
  });
}

/* =========================
   SETTINGS + REMINDERS
========================= */

function renderSettings() {
  const reminders = getReminders();

  document.querySelector("#screen-settings").innerHTML = `

    <div class="card-title">
      <h2 style="font-size:22px">
        Settings
      </h2>
    </div>

    <div class="card">

      <div class="card-title">
        <h2>🔔 Notifications</h2>
      </div>

      <p class="sub" style="margin-bottom:12px">
        Enable notifications to receive your habit reminders.
      </p>

      <button
        class="action primary"
        id="enableNotifications"
        style="width:100%"
      >
        🔔 Enable Notifications
      </button>

      <button
        class="action"
        id="testNotification"
        style="width:100%;margin-top:8px"
      >
        Test Notification
      </button>

    </div>

    <div class="card">

      <div class="card-title">
        <h2>Reminders</h2>
      </div>

      <div class="setting">

        <span>
          🕌 Namaaz reminders
        </span>

        <button
          class="toggle ${
            reminders.namaaz ? "on" : ""
          }"
          dat
