/* Steps 1 and 2: accuracy check on a grid of targets (grid.html?size=N). */
(async function () {
  var size = parseInt(new URLSearchParams(location.search).get("size") || "2", 10);
  if ([2, 3, 4, 5, 6, 8].indexOf(size) < 0) size = 2;
  var TRIALS = 8, SHOW_MS = 3000, SKIP_MS = 500, GAP_MS = 900;
  var testName = "grid-" + size + "x" + size;
  document.getElementById("title").textContent = (size <= 2 ? "Step 1 · Big targets" : "Step 2 · Small targets") + " (" + size + "×" + size + ")";
  document.getElementById("hud").textContent = sessionLabel() + " · " + testName;

  var grid = document.getElementById("grid");
  grid.style.gridTemplateColumns = "repeat(" + size + ", 1fr)";
  grid.style.gridTemplateRows = "repeat(" + size + ", 1fr)";
  var cells = [];
  for (var i = 0; i < size * size; i++) { var c = document.createElement("div"); c.className = "cell"; grid.appendChild(c); cells.push(c); }

  var go = document.getElementById("go");
  try { await startGaze({ training: false, showDot: false }); }
  catch (e) { go.textContent = "Camera failed: " + (e && e.message ? e.message : e); return; }
  var mark = faceWatch(document.getElementById("noface"));

  var collecting = null, all = [];
  onGaze(function (p) { if (!p) return; mark(); if (collecting) { collecting.push(p); all.push(p); } });
  go.disabled = false; go.textContent = "Start 8 trials";

  // pick 8 distinct cells spread across the grid (random order)
  function pickTargets() {
    var idx = cells.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    var out = [];
    while (out.length < TRIALS) out = out.concat(idx);   // 2x2 grid repeats cells
    return out.slice(0, TRIALS);
  }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  go.onclick = async function () {
    document.getElementById("intro").style.display = "none";
    tagClarity(testName);
    var targets = pickTargets(), trials = [];
    var cue = document.getElementById("cue");
    for (var t = 0; t < targets.length; t++) {
      cue.textContent = "Trial " + (t + 1) + " / " + TRIALS;
      await sleep(GAP_MS);
      cue.textContent = "";
      var cell = cells[targets[t]];
      cell.classList.add("lit");
      await sleep(SKIP_MS);                 // ignore the first 0.5 s (eyes still moving)
      collecting = [];
      await sleep(SHOW_MS - SKIP_MS);
      var pts = collecting; collecting = null;
      cell.classList.remove("lit");
      var r = cell.getBoundingClientRect();
      var cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      var inside = pts.filter(function (p) { return inRect(p, r); }).length;
      var err = pts.length ? pts.reduce(function (s, p) { return s + Math.hypot(p.x - cx, p.y - cy); }, 0) / pts.length : NaN;
      var hit = pts.length > 0 && inside / pts.length > 0.5;
      trials.push({ cell: targets[t], samples: pts.length, inside: inside, hit: hit, err: err });
      cell.classList.add(hit ? "hit" : "miss");
      setTimeout((function (c, h) { return function () { c.classList.remove(h ? "hit" : "miss"); }; })(cell, hit), 600);
    }
    var hits = trials.filter(function (x) { return x.hit; }).length;
    var valid = trials.filter(function (x) { return x.samples > 0; });
    var meanErr = valid.length ? Math.round(valid.reduce(function (s, x) { return s + x.err; }, 0) / valid.length) : "";
    var cellW = Math.round(cells[0].getBoundingClientRect().width), cellH = Math.round(cells[0].getBoundingClientRect().height);
    addResult({ test: testName, hits: hits, trials: TRIALS, hit_rate: Math.round(100 * hits / TRIALS) + "%", mean_error_px: meanErr,
                detail: "cell " + cellW + "x" + cellH + "px; samples/trial " + trials.map(function (x) { return x.samples; }).join("/") });

    var res = document.getElementById("res");
    res.innerHTML = "<h3>" + testName + ": " + hits + " / " + TRIALS + " hits (" + Math.round(100 * hits / TRIALS) + "%)</h3>" +
      "<p>Mean distance from target centre: <b>" + meanErr + " px</b><br>Target size: " + cellW + " × " + cellH + " px</p>" +
      "<p class='muted'>A hit means more than 50% of gaze samples fell inside the lit square. Saved to results.</p>" +
      "<div class='row actions'><button onclick='location.reload()'>Run again</button><a class='btn secondary' href='index.html'>Back to steps</a>" +
      "<button class='secondary' id='hm'>Toggle heatmap (H)</button></div>";
    res.style.display = "block";
    var heat = document.getElementById("heat"), shown = false;
    window.toggleHeatmap = function () { shown = !shown; if (shown) drawHeatmap(heat, all); heat.style.display = shown ? "block" : "none"; };
    document.getElementById("hm").onclick = window.toggleHeatmap;
  };
})();
