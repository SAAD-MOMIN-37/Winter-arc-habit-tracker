const KEY = "arc-habits-v2";

const blankDay = () => ({
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
  sleep: 0
});

const defaults = {
  date: null,
  ...blankDay(),
  history: {},
  goals: []
};

let state = load();
let analyticsTab = "week";

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));

    if (saved) {
      return normalize(saved);
    }
  } catch {}

  return structuredClone(defaults);
}

function normalize(saved) {
  const s = {
    ...structuredClone(defaults),
    ...saved
  };

  s.prayers = {
    ...blankDay().prayers,
    ...(saved.prayers || {})
  };

  s.habits = {
    ...blankDay().habits,
    ...(saved.habits || {})
  };

  s.history = saved.history || {};
  s.goals = saved.goals || [];

  return s;
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function today() {
  return dateKey();
}

function ensureToday() {
  if (state.date !== today()) {
    state = {
      ...structuredClone(defaults),
      date: today(),
      history: state.history || {},
      goals: state.goals || []
    };

    save();
  }
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
      })[m]
  );
}

function toast(msg) {
  const t = document.querySelector("#toast");

  t.textContent = msg;
  t.classList.add("show");

  setTimeout(() => {
    t.classList.remove("show");
  }, 1500);
}

function pctFrom(day) {
  const prayer =
    Object.values(day.prayers || {}).filter(Boolean).length / 5;

  const fixed = [
    day.habits?.workout,
    Number(day.steps) >= 10000,
    Number(day.water) >= 3,
    day.habits?.junk === false,
    day.habits?.healthy === true,
    Number(day.learning) >= 60,
    Number(day.productive) >= 240,
    Number(day.sleep) >= 7
  ].filter(Boolean).length / 8;

  return Math.round(((prayer + fixed) / 2) * 100);
}

function pct() {
  return pctFrom(state);
}

function persistToday() {
  state.date = today();

  state.history[today()] = {
    pct: pct(),

    steps: Number(state.steps) || 0,

    water: Number(state.water) || 0,

    sleep: Number(state.sleep) || 0,

    learning: Number(state.learning) || 0,

    productive: Number(state.productive) || 0,

    prayers: {
      ...state.prayers
    },

    habits: {
      ...state.habits
    }
  };

  save();
}

function completedDays() {
  return Object.values(state.history || {}).filter(
    x => Number(x?.pct || 0) >= 70
  ).length;
}

function currentStreak() {
  let count = 0;
  let d = new Date();

  while (true) {
    const k = dateKey(d);

    if (Number(state.history?.[k]?.pct || 0) >= 70) {
      count++;

      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return count;
}

function bestStreak() {
  const keys = Object.keys(state.history || {}).sort();

  let best = 0;
  let run = 0;
  let prev = null;

  for (const k of keys) {
    if (Number(state.history[k]?.pct || 0) >= 70) {
      if (prev) {
        const a = new Date(prev);
        const b = new Date(k);

        const diff = Math.round((b - a) / 86400000);

        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }

      best = Math.max(best, run);

      prev = k;
    }
  }

  return best;
}

function render() {
  ensureToday();

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

function renderHome() {
  const p = pct();

  const prayerDone = Object.values(state.prayers).filter(Boolean).length;

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

      <strong>🔥 ${currentStreak()} days</strong>

      <span>current streak</span>

      <div style="height:12px"></div>

      <span>
        Consistency over intensity.
      </span>

    </div>

  </div>


  <div class="section-label">
    DEEN
  </div>


  <div class="card">

    <div class="card-title">

      <h2>Namaaz</h2>

      <span class="sub">
        ${prayerDone}/5
      </span>

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


  <div class="section-label">
    QUICK STATS
  </div>


  <div class="card">

    <div class="quick-grid">

      <div class="quick">
        <b>${(Number(state.steps) / 1000).toFixed(1)}k</b>
        <small>Steps</small>
      </div>

      <div class="quick">
        <b>${Number(state.water).toFixed(1)}L</b>
        <small>Water</small>
      </div>

      <div class="quick">
        <b>
          ${state.sleep ? formatHours(state.sleep) : "—"}
        </b>
        <small>Sleep</small>
      </div>

    </div>

  </div>


  <div class="section-label">
    TODAY'S HABITS
  </div>


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
      `${Number(state.steps).toLocaleString()} / 10,000`,
      Math.min(100, Number(state.steps) / 100),
      "steps"
    )}

    ${metric(
      "💧",
      "Water",
      `${Number(state.water).toFixed(1)}L / 3L`,
      Math.min(100, (Number(state.water) / 3) * 100),
      "water"
    )}

    ${metric(
      "🍽️",
      "No Junk Food",
      state.habits.junk ? "Missed" : "On track",
      state.habits.junk ? 0 : 100,
      "junk"
    )}

    ${metric(
      "🥗",
      "Healthy Meals",
      state.habits.healthy ? "On track" : "Not logged",
      state.habits.healthy ? 100 : 0,
      "healthy"
    )}

    ${metric(
      "📚",
      "Read / Learn",
      `${Number(state.learning)} / 60 min`,
      Math.min(100, (Number(state.learning) / 60) * 100),
      "learning"
    )}

    ${metric(
      "🎯",
      "Productive Work",
      `${Math.floor(Number(state.productive) / 60)}h ${
        Number(state.productive) % 60
      }m / 4h`,
      Math.min(100, (Number(state.productive) / 240) * 100),
      "productive"
    )}

  </div>


  <div class="card">

    <div class="card-title">

      <h2>😴 Sleep</h2>

      <button class="action" id="sleepEdit">
        Edit
      </button>

    </div>

    <div style="font-size:12px;color:var(--muted)">
      Last night
    </div>

    <div
      style="
        font-size:24px;
        font-weight:800;
        margin:5px 0
      "
    >
      ${state.sleep ? formatHours(state.sleep) : "Not logged"}
    </div>

    <div class="sub">
      Target 7–9h
    </div>

  </div>


  <div class="card">

    <div class="card-title">

      <h2>✍️ Daily Inputs</h2>

      <span class="sub">
        Update today's values
      </span>

    </div>


    <div class="form-row">

      <div>

        <label class="sub">
          Steps
        </label>

        <input
          id="stepsInput"
          class="input"
          type="number"
          min="0"
          step="1"
          value="${state.steps}"
          placeholder="0"
        >

      </div>


      <div>

        <label class="sub">
          Water (L)
        </label>

        <input
          id="waterInput"
          class="input"
          type="number"
          min="0"
          step="0.1"
          value="${state.water}"
          placeholder="0"
        >

      </div>

    </div>


    <div style="height:8px"></div>


    <div class="form-row">

      <div>

        <label class="sub">
          Learning (min)
        </label>

        <input
          id="learningInput"
          class="input"
          type="number"
          min="0"
          step="1"
          value="${state.learning}"
          placeholder="0"
        >

      </div>


      <div>

        <label class="sub">
          Productive (min)
        </label>

        <input
          id="productiveInput"
          class="input"
          type="number"
          min="0"
          step="1"
          value="${state.productive}"
          placeholder="0"
        >

      </div>

    </div>


    <div style="height:10px"></div>


    <button
      class="action primary"
      id="saveInputs"
      style="width:100%"
    >
      Save today's inputs
    </button>

  </div>
  `;


  document
    .querySelectorAll("[data-prayer]")
    .forEach(b => {
      b.onclick = () => {

        state.prayers[b.dataset.prayer] =
          !state.prayers[b.dataset.prayer];

        persistToday();

        render();
      };
    });


  document
    .querySelectorAll("[data-habit]")
    .forEach(b => {

      b.onclick = () => {

        state.habits[b.dataset.habit] =
          !state.habits[b.dataset.habit];

        persistToday();

        render();
      };

    });


  document.querySelector("#sleepEdit").onclick = () => {
    openSleep();
  };


  document.querySelector("#saveInputs").onclick = () => {

    state.steps =
      Math.max(
        0,
        Number(
          document.querySelector("#stepsInput").value
        ) || 0
      );

    state.water =
      Math.max(
        0,
        Number(
          document.querySelector("#waterInput").value
        ) || 0
      );

    state.learning =
      Math.max(
        0,
        Number(
          document.querySelector("#learningInput").value
        ) || 0
      );

    state.productive =
      Math.max(
        0,
        Number(
          document.querySelector("#productiveInput").value
        ) || 0
      );

    persistToday();

    render();

    toast("Today's inputs saved");
  };
}


function metric(
  icon,
  name,
  value,
  width,
  key
) {

  const clickable = [
    "workout",
    "junk",
    "healthy"
  ].includes(key);


  return `
    <div
      class="metric"
      ${
        clickable
          ? `data-habit="${key}" style="cursor:pointer"`
          : ""
      }
    >

      <span class="icon">
        ${icon}
      </span>

      <div>

        <div class="metric-name">
          ${name}
        </div>

        <div class="metric-value">
          ${value}
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


function formatHours(x) {

  const h =
    Math.floor(Number(x) || 0);

  const m =
    Math.round(
      ((Number(x) || 0) - h) * 60
    );

  return `${h}h ${String(m).padStart(2, "0")}m`;
}


function renderProgress() {

  const vals =
    analyticsData(analyticsTab);

  const avg =
    vals.length
      ? Math.round(
          vals.reduce(
            (a, b) => a + b.p,
            0
          ) / vals.length
        )
      : 0;


  const hist =
    Object.values(
      state.history || {}
    );


  const avgSteps =
    hist.length
      ? Math.round(
          hist.reduce(
            (a, b) =>
              a + Number(b.steps || 0),
            0
          ) / hist.length
        )
      : Number(state.steps) || 0;


  const avgWater =
    hist.length
      ? hist.reduce(
          (a, b) =>
            a + Number(b.water || 0),
          0
        ) / hist.length
      : Number(state.water) || 0;


  const avgSleep =
    hist.length
      ? hist.reduce(
          (a, b) =>
            a + Number(b.sleep || 0),
          0
        ) / hist.length
      : Number(state.sleep) || 0;


  const consistency = [

    [
      "Namaaz",
      "🕌",
      habitConsistency("prayers")
    ],

    [
      "Workout",
      "🏋️",
      habitConsistency("workout")
    ],

    [
      "Steps",
      "👟",
      habitConsistency("steps")
    ],

    [
      "Water",
      "💧",
      habitConsistency("water")
    ],

    [
      "Learning",
      "📚",
      habitConsistency("learning")
    ],

    [
      "Sleep",
      "😴",
      habitConsistency("sleep")
    ]

  ];


  document.querySelector(
    "#screen-progress"
  ).innerHTML = `

  <div class="card-title">

    <h2 style="font-size:22px">
      Progress
    </h2>

    <span class="sub">
      Analytics
    </span>

  </div>


  <div class="tabs">

    ${["day", "week", "month"]
      .map(
        x => `
          <button
            class="tab ${
              analyticsTab === x
                ? "active"
                : ""
            }"
            data-tab="${x}"
          >
            ${
              x[0].toUpperCase() +
              x.slice(1)
            }
          </button>
        `
      )
      .join("")}

  </div>


  <div class="card progress-card">

    <div
      class="ring"
      style="--p:${avg}%"
    >

      <div class="ring-content">

        <strong>${avg}%</strong>

        <span>
          completion
        </span>

      </div>

    </div>


    <div class="streak">

      <strong>
        🔥 ${currentStreak()} days
      </strong>

      <span>
        current streak
      </span>

      <div style="height:12px"></div>

      <span>
        Best streak
        <b style="color:var(--text)">
          ${bestStreak()} days
        </b>
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

      <span class="sub">
        ${analyticsTab}
      </span>

    </div>


    <div class="chart">

      ${vals
        .map(
          v => `
            <div class="bar-col">

              <i
                style="
                  height:${Math.max(
                    4,
                    v.p
                  )}%
                "
              ></i>

              <small>
                ${v.label}
              </small>

            </div>
          `
        )
        .join("")}

    </div>

  </div>


  <div class="stat-grid">

    <div class="stat">

      <strong>
        ${avgSteps.toLocaleString()}
      </strong>

      <small>
        Avg. steps
      </small>

    </div>


    <div class="stat">

      <strong>
        ${avgWater.toFixed(1)}L
      </strong>

      <small>
        Avg. water
      </small>

    </div>


    <div class="stat">

      <strong>
        ${
          avgSleep
            ? formatHours(avgSleep)
            : "—"
        }
      </strong>

      <small>
        Avg. sleep
      </small>

    </div>


    <div class="stat">

      <strong>
        ${Number(state.learning)}m
      </strong>

      <small>
        Learning today
      </small>

    </div>

  </div>


  <div class="card">

    <div class="card-title">

      <h2>
        Habit Consistency
      </h2>

      <span class="sub">
        ${Object.keys(state.history || {}).length}
        logged days
      </span>

    </div>


    ${consistency
      .map(
        ([n, icon, q]) => `
          <div class="metric">

            <span class="icon">
              ${icon}
            </span>

            <div>

              <div class="metric-name">
                ${n}
              </div>

              <div class="bar">
                <i
                  style="--w:${q}%"
                ></i>
              </div>

            </div>

            <span class="metric-value">
              ${q}%
            </span>

          </div>
        `
      )
      .join("")}

  </div>
  `;


  document
    .querySelectorAll("[data-tab]")
    .forEach(b => {

      b.onclick = () => {

        analyticsTab =
          b.dataset.tab;

        renderProgress();
      };

    });
}


function analyticsData(tab) {

  const now = new Date();


  if (tab === "day") {

    return [
      {
        label: "Today",
        p: pct()
      }
    ];

  }


  if (tab === "week") {

    const arr = [];

    for (let i = 6; i >= 0; i--) {

      const d =
        new Date(now);

      d.setDate(
        now.getDate() - i
      );

      const k =
        dateKey(d);


      arr.push({

        label:
          d.toLocaleDateString(
            "en-IN",
            {
              weekday: "short"
            }
          ),

        p:
          Number(
            state.history?.[k]?.pct || 0
          )

      });

    }

    return arr;
  }


  const year =
    now.getFullYear();

  const month =
    now.getMonth();

  const days =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  return Array.from(
    { length: days },
    (_, i) => {

      const k =
        dateKey(
          new Date(
            year,
            month,
            i + 1
          )
        );

      return {
        label: String(i + 1),

        p:
          Number(
            state.history?.[k]?.pct || 0
          )
      };

    }
  );
}


function habitConsistency(type) {

  const vals =
    Object.values(
      state.history || {}
    );


  if (!vals.length) {
    return 0;
  }


  let done = 0;


  for (const d of vals) {

    if (
      type === "prayers" &&
      Object.values(
        d.prayers || {}
      ).filter(Boolean).length === 5
    ) {
      done++;
    }


    if (
      type === "workout" &&
      d.habits?.workout
    ) {
      done++;
    }


    if (
      type === "steps" &&
      Number(d.steps) >= 10000
    ) {
      done++;
    }


    if (
      type === "water" &&
      Number(d.water) >= 3
    ) {
      done++;
    }


    if (
      type === "learning" &&
      Number(d.learning) >= 60
    ) {
      done++;
    }


    if (
      type === "sleep" &&
      Number(d.sleep) >= 7
    ) {
      done++;
    }

  }


  return Math.round(
    (done / vals.length) * 100
  );
}


function renderGoals() {

  document.querySelector(
    "#screen-goals"
  ).innerHTML = `

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


  ${
    state.goals.length
      ? `
        <div class="card">

          <div class="card-title">

            <h2>
              Monthly Goals
            </h2>

            <span class="sub">
              ${new Intl.DateTimeFormat(
                "en-IN",
                {
                  month: "long",
                  year: "numeric"
                }
              ).format(new Date())}
            </span>

          </div>


          ${state.goals
            .map(
              g => `
                <div class="goal">

                  <div class="goal-head">

                    <b>
                      ${esc(g.name)}
                    </b>

                    <span>
                      ${g.p}%
                    </span>

                  </div>

                  <p>
                    ${esc(g.desc || "")}
                  </p>

                  <div class="bar">
                    <i
                      style="--w:${g.p}%"
                    ></i>
                  </div>

                </div>
              `
            )
            .join("")}

        </div>
      `
      : `
        <div class="card">

          <div class="card-title">

            <h2>
              No goals yet
            </h2>

          </div>

          <p>
            Add your first monthly goal.
          </p>

        </div>
      `
  }
  `;


  document.querySelector(
    "#addGoal"
  ).onclick = () => {
    openGoal();
  };
}


function renderHistory() {

  const now = new Date();

  const y = now.getFullYear();

  const m = now.getMonth();

  const first =
    new Date(y, m, 1);

  const days =
    new Date(
      y,
      m + 1,
      0
    ).getDate();


  const start =
    (first.getDay() + 6) % 7;


  let cells =
    [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun"
    ]
      .map(
        x =>
          `<div class="dayname">${x}</div>`
      )
      .join("");


  for (
    let i = 0;
    i < start;
    i++
  ) {
    cells += `<div></div>`;
  }


  for (
    let d = 1;
    d <= days;
    d++
  ) {

    const k =
      dateKey(
        new Date(
          y,
          m,
          d
        )
      );


    const has =
      Number(
        state.history?.[k]?.pct || 0
      ) >= 70;


    cells += `

      <div
        class="day
          ${has ? "has" : ""}
          ${
            d === now.getDate()
              ? "today"
              : ""
          }"
        data-day="${k}"
      >
        ${d}
      </div>

    `;
  }


  const hist =
    Object.values(
      state.history || {}
    );


  const consistency =
    hist.length
      ? Math.round(
          hist.reduce(
            (a, b) =>
              a + Number(b.pct || 0),
            0
          ) / hist.length
        )
      : 0;


  const avgSleep =
    hist.length
      ? hist.reduce(
          (a, b) =>
            a + Number(b.sleep || 0),
          0
        ) / hist.length
      : 0;


  document.querySelector(
    "#screen-history"
  ).innerHTML = `

  <div class="card-title">

    <h2 style="font-size:22px">
      History
    </h2>

    <span class="sub">
      ${new Intl.DateTimeFormat(
        "en-IN",
        {
          month: "long",
          year: "numeric"
        }
      ).format(now)}
    </span>

  </div>


  <div class="card">

    <div class="calendar">
      ${cells}
    </div>

  </div>


  <div class="card">

    <div class="card-title">

      <h2>
        Monthly Reflection
      </h2>

    </div>


    <div class="stat-grid">

      <div class="stat">

        <strong>
          ${consistency}%
        </strong>

        <small>
          Consistency
        </small>

      </div>


      <div class="stat">

        <strong>
          ${bestStreak()}d
        </strong>

        <small>
          Best streak
        </small>

      </div>


      <div class="stat">

        <strong>
          ${completedDays()}
        </strong>

        <small>
          Days completed
        </small>

      </div>


      <div class="stat">

        <strong>
          ${
            avgSleep
              ? formatHours(avgSleep)
              : "—"
          }
        </strong>

        <small>
          Avg. sleep
        </small>

      </div>

    </div>

  </div>
  `;


  document
    .querySelectorAll("[data-day]")
    .forEach(b => {

      b.onclick = () => {

        toast(
          `${b.dataset.day}: ${
            state.history[
              b.dataset.day
            ]?.pct || 0
          }% completion`
        );

      };

    });
}


function renderSettings() {

  document.querySelector(
    "#screen-settings"
  ).innerHTML = `

  <div class="card-title">

    <h2 style="font-size:22px">
      Settings
    </h2>

  </div>


  <div class="card">

    <div class="setting">
      <span>Manage habits</span>
      <span>›</span>
    </div>

    <div class="setting">
      <span>Add custom habit</span>
      <span>›</span>
    </div>

    <div class="setting">
      <span>Change targets</span>
      <span>›</span>
    </div>

    <div class="setting">
      <span>Reorder habits</span>
      <span>›</span>
    </div>

  </div>


  <div class="card">

    <div class="card-title">

      <h2>
        Reminders
      </h2>

    </div>


    <div class="setting">

      <span>
        🕌 Namaaz reminders
      </span>

      <button class="toggle on">
        <i></i>
      </button>

    </div>


    <div class="setting">

      <span>
        💧 Water reminders
      </span>

      <button class="toggle on">
        <i></i>
      </button>

    </div>


    <div class="setting">

      <span>
        🏋️ Workout reminder
      </span>

      <button class="toggle">
        <i></i>
      </button>

    </div>


    <div class="setting">

      <span>
        😴 Sleep reminder
      </span>

      <button class="toggle on">
        <i></i>
      </button>

    </div>

  </div>


  <div class="card">

    <div class="card-title">

      <h2>
        Data
      </h2>

    </div>


    <div
      class="setting"
      id="export"
    >

      <span>
        Export data
      </span>

      <span>
        ›
      </span>

    </div>


    <div
      class="setting"
      id="reset"
    >

      <span>
        Reset local data
      </span>

      <span style="color:var(--danger)">
        ›
      </span>

    </div>

  </div>
  `;


  document.querySelector(
    "#export"
  ).onclick = () => {

    const blob =
      new Blob(
        [
          JSON.stringify(
            state,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );


    const a =
      document.createElement(
        "a"
      );


    a.href =
      URL.createObjectURL(
        blob
      );


    a.download =
      "arc-habit-data.json";


    a.click();


    URL.revokeObjectURL(
      a.href
    );
  };


  document.querySelector(
    "#reset"
  ).onclick = () => {

    if (
      confirm(
        "Reset all local app data?"
      )
    ) {

      localStorage.removeItem(
        KEY
      );


      state = {
        ...structuredClone(
          defaults
        ),
        date: today()
      };


      save();

      render();

      toast(
        "Data reset"
      );
    }
  };


  document
    .querySelectorAll(
      ".toggle"
    )
    .forEach(t => {

      t.onclick = () => {
        t.classList.toggle(
          "on"
        );
      };

    });
}


function openSleep() {

  openSheet(`

    <h3>
      Update sleep
    </h3>

    <p>
      Set last night's total sleep.
    </p>

    <input
      id="sleepInput"
      class="input"
      type="number"
      min="0"
      max="16"
      step=".25"
      value="${state.sleep}"
      placeholder="Hours"
    >

    <br><br>

    <button
      class="action primary"
      id="saveSleep"
    >
      Save
    </button>

  `);


  document.querySelector(
    "#saveSleep"
  ).onclick = () => {

    state.sleep =
      Math.max(
        0,
        Number(
          document.querySelector(
            "#sleepInput"
          ).value
        ) || 0
      );


    persistToday();

    closeModal();

    render();

    toast(
      "Sleep saved"
    );
  };
}


function openGoal() {

  openSheet(`

    <h3>
      Add monthly goal
    </h3>

    <p>
      Create a goal for your dashboard.
    </p>

    <input
      id="goalName"
      class="input"
      placeholder="Goal name"
    >

    <br><br>

    <input
      id="goalDesc"
      class="input"
      placeholder="Short description"
    >

    <br><br>

    <button
      class="action primary"
      id="saveGoal"
    >
      Add goal
    </button>

  `);


  document.querySelector(
    "#saveGoal"
  ).onclick = () => {

    const n =
      document.querySelector(
        "#goalName"
      ).value.trim();


    if (!n) return;


    state.goals.push({
      name: n,

      desc:
        document.querySelector(
          "#goalDesc"
        ).value.trim(),

      p: 0
    });


    save();

    closeModal();

    render();

    toast(
      "Goal added"
    );
  };
}


function openSheet(html) {

  document.querySelector(
    "#modal"
  ).classList.remove(
    "hidden"
  );


  document.querySelector(
    "#modal"
  ).innerHTML = `

    <div class="sheet">

      ${html}

      <button
        class="action"
        id="closeModal"
        style="
          margin-top:8px;
          width:100%
        "
      >
        Cancel
      </button>

    </div>

  `;


  document.querySelector(
    "#closeModal"
  ).onclick =
    closeModal;
}


function closeModal() {

  document.querySelector(
    "#modal"
  ).classList.add(
    "hidden"
  );
}


document
  .querySelectorAll(
    ".nav-btn"
  )
  .forEach(b => {

    b.onclick = () => {

      document
        .querySelectorAll(
          ".nav-btn"
        )
        .forEach(x =>
          x.classList.remove(
            "active"
          )
        );


      b.classList.add(
        "active"
      );


      document
        .querySelectorAll(
          ".screen"
        )
        .forEach(s =>
          s.classList.remove(
            "active"
          )
        );


      document
        .querySelector(
          "#screen-" +
            b.dataset.screen
        )
        .classList.add(
          "active"
        );

    };

  });


ensureToday();

save();

render();


if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("sw.js")
        .catch(() => {});

    }
  );

}
