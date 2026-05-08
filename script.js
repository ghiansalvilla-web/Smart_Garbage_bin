/* ============================
   FIREBASE CONFIG
   ============================ */
const firebaseConfig = {
  apiKey: "AIzaSyBdmxDRFTyU05XKGZaHaXwcHp-nuwBjVR0",
  databaseURL: "https://smartgarbagebin-996d0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smartgarbagebin-996d0",
  messagingSenderId: "413668818423",
  appId: "1:413668818423:web:9464b7cd8b074bd01102f2"
};

/* ============================
   LOGIN
   ============================ */
function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;
  const err  = document.getElementById("error");

  if (user === "admin" && pass === "1234") {
    sessionStorage.setItem("loggedIn", "true");
    window.location.href = "dashboard.html";
  } else {
    err.innerText = "Invalid username or password.";
  }
}

if (document.getElementById("password")) {
  document.getElementById("password").addEventListener("keydown", e => {
    if (e.key === "Enter") login();
  });
}

function logout() {
  sessionStorage.removeItem("loggedIn");
  window.location.href = "index.html";
}

/* ============================
   DASHBOARD GUARD
   ============================ */
if (window.location.pathname.includes("dashboard")) {
  if (!sessionStorage.getItem("loggedIn")) {
    window.location.href = "index.html";
  }
}

/* ============================
   DASHBOARD — FIREBASE + UI
   ============================ */
if (document.getElementById("bins-grid")) {

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.database();

  // State
  const binState      = {};
  const notifLog      = [];
  const notifSeen     = {};
  const notifCooldown = {};
  const COOLDOWN_MS   = 60000; // 1 minute between notifications per bin

  const BIN_LABELS = {
    bin1: "Bin #1",
  };

  /* ---------- ENABLE NOTIFICATIONS ---------- */
  async function enableNotifications() {
    if (!("Notification" in window)) {
      alert("Your browser does not support notifications.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      const btn = document.getElementById("btn-notif");

      if (permission === "granted") {
        if (btn) {
          btn.textContent = "🔔 ON";
          btn.classList.add("enabled");
        }
        if ("serviceWorker" in navigator) {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        }
        // Send test notification immediately so user knows it works
        new Notification("✅ Alerts Enabled!", {
          body: "You will now receive bin full notifications.",
          icon: "/icon.png"
        });
      } else {
        alert("Notifications blocked. Go to browser settings and allow notifications for this site.");
      }
    } catch (err) {
      console.error("Notification error:", err);
    }
  }

  // Restore button state on page load if already allowed
  window.addEventListener("load", () => {
    const btn = document.getElementById("btn-notif");
    if (btn && Notification.permission === "granted") {
      btn.textContent = "🔔 ON";
      btn.classList.add("enabled");
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/firebase-messaging-sw.js");
      }
    }
  });

  /* ---------- SEND PUSH NOTIFICATION ---------- */
  function sendPushNotif(label, pct) {
    if (Notification.permission !== "granted") return;
    new Notification(`🚨 ${label} is FULL!`, {
      body: `Fill level at ${pct}% — needs immediate collection!`,
      icon: "/icon.png",
      badge: "/icon.png",
      vibrate: [200, 100, 200],
      tag: label
    });
  }

  /* ---------- RENDER BIN CARD ---------- */
  function renderBinCard(binId) {
    const s      = binState[binId] || { level: 0, status: "EMPTY" };
    const label  = BIN_LABELS[binId] || binId;
    const pct    = Math.min(100, Math.max(0, Math.round(s.level)));
    const status = (s.status || "EMPTY").toUpperCase();

    const colorClass  = status === "FULL" ? "color-full"
                      : status === "HALF" ? "color-half"
                      : "color-empty";

    const statusClass = status === "FULL" ? "status-full"
                      : status === "HALF" ? "status-half"
                      : "status-empty";

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    let card = document.getElementById("card-" + binId);
    if (!card) {
      card = document.createElement("div");
      card.className = "bin-card";
      card.id = "card-" + binId;
      document.getElementById("bins-grid").appendChild(card);
    }

    card.className = `bin-card ${statusClass}`;
    card.innerHTML = `
      <div class="bin-card-header">
        <span class="bin-name">${label}</span>
        <span class="bin-status-badge badge-${status}">${status}</span>
      </div>
      <div class="fill-bar-wrap">
        <div class="fill-bar-inner ${colorClass}" style="width: ${pct}%"></div>
      </div>
      <div class="fill-label">
        <span>Fill level</span>
        <span class="fill-pct">${pct}%</span>
      </div>
      <div class="bin-meta">Last updated: ${now}</div>
    `;
  }

  /* ---------- ADD NOTIFICATION ---------- */
  function addNotification(binId, status, level) {
    if (status !== "FULL") return;

    const label = BIN_LABELS[binId] || binId;
    const pct   = Math.round(level);
    const now   = new Date().toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit"
    });

    notifLog.unshift({
      msg: `🗑️ ${label} is FULL (${pct}%) — needs immediate collection!`,
      levelClass: "level-full",
      dotClass: "dot-full",
      time: now
    });

    // Top banner
    const banner = document.getElementById("notif-banner");
    banner.textContent = `🚨 ${label} is FULL — requires immediate collection!`;
    banner.classList.remove("hidden");
    setTimeout(() => banner.classList.add("hidden"), 8000);

    // Phone push notification
    sendPushNotif(label, pct);

    renderNotifList();
  }

  function renderNotifList() {
    const list = document.getElementById("notif-list");
    if (notifLog.length === 0) {
      list.innerHTML = `<p class="notif-empty">No alerts yet.</p>`;
      return;
    }
    list.innerHTML = notifLog.slice(0, 50).map(n => `
      <div class="notif-item ${n.levelClass}">
        <div class="notif-dot ${n.dotClass}"></div>
        <span class="notif-text">${n.msg}</span>
        <span class="notif-time">${n.time}</span>
      </div>
    `).join("");
  }

  function clearNotifs() {
    notifLog.length = 0;
    renderNotifList();
  }

  /* ---------- SUMMARY PILLS ---------- */
  function updateSummary() {
    let ok = 0, half = 0, full = 0;
    for (const id in binState) {
      const s = (binState[id].status || "").toUpperCase();
      if (s === "FULL")      full++;
      else if (s === "HALF") half++;
      else                   ok++;
    }
    document.getElementById("pill-ok").textContent   = `${ok} OK`;
    document.getElementById("pill-half").textContent = `${half} Half`;
    document.getElementById("pill-full").textContent = `${full} Full`;
  }

  /* ---------- FIREBASE LISTENER ---------- */
  db.ref("bins").on("value", snapshot => {
    const data = snapshot.val();
    if (!data) return;

    for (const binId in data) {
      if (binId === "bin2") continue;

      const d = data[binId];
      if (d === null) continue;

      const level  = Math.min(100, Math.max(0, parseFloat(d.trashLevel) || 0));
      const status = (d.status || "EMPTY").toUpperCase();

      // Notify with cooldown whenever bin is FULL
      if (status === "FULL") {
        const now = Date.now();
        const lastNotif = notifCooldown[binId] || 0;
        if ((now - lastNotif) > COOLDOWN_MS) {
          addNotification(binId, status, level);
          notifCooldown[binId] = now;
        }
      }

      notifSeen[binId] = status;
      binState[binId]  = { level, status };
      renderBinCard(binId);
    }

    updateSummary();
  });

  /* ---------- EMPTY DEFAULTS ---------- */
  setTimeout(() => {
    const grid = document.getElementById("bins-grid");
    if (grid && grid.children.length === 0) {
      const defaultData = {
        bin1: { level: 0, status: "EMPTY" },
        bin3: { level: 0, status: "EMPTY" }
      };
      for (const binId in defaultData) {
        const d = defaultData[binId];
        binState[binId]  = d;
        notifSeen[binId] = d.status.toUpperCase();
        renderBinCard(binId);
      }
      updateSummary();
    }
  }, 2500);

} // end dashboard block
