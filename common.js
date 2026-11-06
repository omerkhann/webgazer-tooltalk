/* Shared helpers for the WebGazer Tool Talk test site. */

// ---------- Microsoft Clarity (loads only if CONFIG.CLARITY_ID is set) ----------
(function () {
  var id = window.CONFIG && window.CONFIG.CLARITY_ID;
  if (!id) return;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", id);
})();

// ---------- Storage (wrapped: never let a storage error break a session) ----------
var Store = {
  get: function (k, d) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
  },
  set: function (k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }
};

function getSession() {
  return Store.get("wg_session", { participant: "P1", condition: "baseline" });
}
function setSession(s) { Store.set("wg_session", s); }

function addResult(r) {
  var all = Store.get("wg_results", []);
  var s = getSession();
  all.push(Object.assign({
    time: new Date().toISOString(),
    participant: s.participant,
    condition: s.condition,
    viewport: window.innerWidth + "x" + window.innerHeight
  }, r));
  Store.set("wg_results", all);
}

function tagClarity(page) {
  if (!window.clarity) return;
  var s = getSession();
  window.clarity("set", "participant", s.participant);
  window.clarity("set", "condition", s.condition);
  if (page) window.clarity("set", "page", page);
}

function sessionLabel() {
  var s = getSession();
  return s.participant + " · " + s.condition;
}

// ---------- WebGazer start-up ----------
// training=true only on the calibration page. On test pages, clicks and mouse
// movement must NOT train the model, or it would "learn" the answers.
async function startGaze(opts) {
  opts = opts || {};
  var wg = window.webgazer;
  wg.params.faceMeshSolutionPath = "./mediapipe/face_mesh";
  wg.params.showVideo = false;          // no face on screen by default (press V to toggle)
  wg.params.showFaceOverlay = false;
  wg.params.showFaceFeedbackBox = false;
  wg.saveDataAcrossSessions(true);       // calibration carries over between pages
  wg.applyKalmanFilter(true);
  await wg.setRegression("ridge").begin();
  if (!opts.training) wg.removeMouseEventListeners();
  setVideo(false);
  wg.showPredictionPoints(!!opts.showDot);
  installKeys(opts);
  return wg;
}

var _videoOn = false, _dotOn = false;
function setVideo(on) {
  _videoOn = on;
  webgazer.showVideo(on);
  webgazer.showFaceOverlay(on);
  webgazer.showFaceFeedbackBox(on);
}
function installKeys(opts) {
  _dotOn = !!opts.showDot;
  document.addEventListener("keydown", function (e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")) return;
    var k = e.key.toLowerCase();
    if (k === "v") setVideo(!_videoOn);
    if (k === "d") { _dotOn = !_dotOn; webgazer.showPredictionPoints(_dotOn); }
    if (k === "h" && typeof window.toggleHeatmap === "function") window.toggleHeatmap();
  });
}

// Single gaze listener shared by a page. handler(point|null) is called ~20x/sec.
// point = {x, y, t} in viewport pixels; null when no face is detected.
function onGaze(handler) {
  var t0 = performance.now();
  webgazer.setGazeListener(function (data) {
    if (!data) { handler(null); return; }
    handler({ x: data.x, y: data.y, t: performance.now() - t0 });
  });
}

// Shows "face not found" warning when predictions stop arriving.
function faceWatch(el) {
  var last = performance.now();
  setInterval(function () {
    if (!el) return;
    el.style.display = (performance.now() - last > 1500) ? "block" : "none";
  }, 500);
  return function mark() { last = performance.now(); };
}

// ---------- Simple canvas heatmap (no external library) ----------
function drawHeatmap(canvas, points, radius) {
  radius = radius || 45;
  var dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!points.length) return;
  // 1) accumulate intensity in the alpha channel
  var a = Math.max(0.02, Math.min(0.25, 12 / points.length));
  points.forEach(function (p) {
    var x = p.x * dpr, y = p.y * dpr, r = radius * dpr;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(0,0,0," + a + ")");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  });
  // 2) colourise: blue -> green -> yellow -> red
  var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var d = img.data, max = 0;
  for (var i = 3; i < d.length; i += 4) if (d[i] > max) max = d[i];
  if (!max) return;
  for (var j = 0; j < d.length; j += 4) {
    var v = d[j + 3] / max;
    if (v < 0.03) { d[j + 3] = 0; continue; }
    var r2, g2, b2;
    if (v < 0.33) { r2 = 0; g2 = Math.round(255 * v / 0.33); b2 = 255; }
    else if (v < 0.66) { r2 = Math.round(255 * (v - 0.33) / 0.33); g2 = 255; b2 = Math.round(255 * (1 - (v - 0.33) / 0.33)); }
    else { r2 = 255; g2 = Math.round(255 * (1 - (v - 0.66) / 0.34)); b2 = 0; }
    d[j] = r2; d[j + 1] = g2; d[j + 2] = b2; d[j + 3] = Math.round(170 * Math.min(1, v * 1.3));
  }
  ctx.putImageData(img, 0, 0);
}

// ---------- Helpers ----------
function inRect(p, r) { return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom; }

function downloadText(name, text, type) {
  var blob = new Blob([text], { type: type || "text/csv" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

function pointsToCSV(points) {
  return "t_ms,x,y\n" + points.map(function (p) { return Math.round(p.t) + "," + Math.round(p.x) + "," + Math.round(p.y); }).join("\n");
}
