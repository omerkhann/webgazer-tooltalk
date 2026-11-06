/* Shared logic for Task 1 and Task 2 on the mock news page. */
async function runTask(mode) {
  var T = {
    task1: {
      title: "Task 1 · Pick a story",
      instr: "Look over the homepage as you normally would, then <b>click the story you would read first</b>.",
      note: "Expected: WebGazer shows which large story blocks you looked at, including ones you didn't click. Clarity shows only the click.",
      sel: ".story", key: "data-story", label: function (el) { return el.querySelector("h2").textContent; }
    },
    task2: {
      title: "Task 2 · Find a menu link",
      instr: "<b>Click the “Sports” link</b> in the menu bar under the newspaper name.",
      note: "Expected: gaze estimates spread across several neighbouring menu links, so you can't tell which one was read. Clarity records the exact click.",
      sel: ".navlink", key: "data-nav", label: function (el) { return el.textContent; }
    }
  }[mode];

  buildNews(document.getElementById("page"));
  document.getElementById("hud").textContent = sessionLabel() + " · " + mode;
  document.getElementById("title").textContent = T.title;
  document.getElementById("instr").innerHTML = T.instr;
  document.getElementById("note").textContent = T.note;

  var go = document.getElementById("go");
  try { await startGaze({ training: false, showDot: false }); }
  catch (e) { go.textContent = "Camera failed: " + (e && e.message ? e.message : e); return; }
  var mark = faceWatch(document.getElementById("noface"));
  var rec = null;
  onGaze(function (p) { if (!p) return; mark(); if (rec) rec.push(p); });
  go.disabled = false; go.textContent = "Start task";

  var started = 0, finished = false;
  go.onclick = function () {
    document.getElementById("intro").style.display = "none";
    tagClarity(mode);
    rec = []; started = performance.now();
  };

  // links never navigate
  document.querySelectorAll("#page a").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); }); });

  document.querySelectorAll(T.sel).forEach(function (el) {
    el.addEventListener("click", function () {
      if (!rec || finished) return;
      finished = true;
      var pts = rec; rec = null;
      var tEnd = pts.length ? pts[pts.length - 1].t : 0;
      var elapsed = ((performance.now() - started) / 1000).toFixed(1);
      var targets = Array.prototype.slice.call(document.querySelectorAll(T.sel));
      var rects = targets.map(function (t) { return { name: t.getAttribute(T.key), label: T.label(t), r: t.getBoundingClientRect() }; });

      // Task 1: share of ALL gaze samples in each story.
      // Task 2: share of samples in the last 2 s before the click (when the eyes are on the link).
      var window_ = mode === "task2" ? pts.filter(function (p) { return p.t >= tEnd - 2000; }) : pts;
      var counts = rects.map(function (x) { return { name: x.name, label: x.label, n: 0 }; });
      var outside = 0;
      window_.forEach(function (p) {
        var k = -1;
        for (var i = 0; i < rects.length; i++) if (inRect(p, rects[i].r)) { k = i; break; }
        if (k >= 0) counts[k].n++; else outside++;
      });
      var total = window_.length || 1;
      counts.sort(function (a, b) { return b.n - a.n; });
      var clicked = el.getAttribute(T.key);
      var top = counts[0];
      var spread = counts.filter(function (c) { return c.n / total >= 0.10; }).length;

      var rows = counts.filter(function (c) { return c.n > 0; }).map(function (c) {
        var pct = Math.round(100 * c.n / total);
        return "<tr><td>" + c.name + (c.name === clicked ? " <b>(clicked)</b>" : "") + "</td><td class='bar-cell'><div class='bar' style='width:" + pct + "%'></div></td><td class='num'>" + pct + "%</td></tr>";
      }).join("");
      var outPct = Math.round(100 * outside / total);
      rows += "<tr><td class='muted'>" + (mode === "task2" ? "outside the menu links" : "outside the stories") + "</td><td class='bar-cell'><div class='bar bar-outside' style='width:" + outPct + "%'></div></td><td class='num'>" + outPct + "%</td></tr>";

      var summary = mode === "task1"
        ? "Clicked <b>" + clicked + "</b> after " + elapsed + " s. Gaze landed on " + counts.filter(function (c) { return c.n / total >= 0.10; }).length + " stories (≥10% of samples each)."
        : "Clicked <b>" + clicked + "</b>" + (clicked === "Sports" ? "" : " (wrong link)") + " after " + elapsed + " s. In the last 2 s, the most-gazed link was <b>" + (top.n ? top.name : "none") + "</b>" +
          (top.name === clicked ? " (matches the click)" : (counts.filter(function (c) { return c.name === clicked; })[0] || {}).n === top.n ? " (tied with the clicked link)" : " (doesn't match the click)") + "; " + spread + " link(s) got ≥10% of samples.";

      addResult({ test: mode, clicked: clicked, hits: "", trials: "", hit_rate: "", mean_error_px: "",
        detail: (mode === "task2" ? "last2s " : "all ") + "samples=" + window_.length + "; top=" + top.name + " " + Math.round(100 * top.n / total) + "%; spread>=10%=" + spread + "; outside=" + outPct + "%; time=" + elapsed + "s" });

      var res = document.getElementById("res");
      res.innerHTML = "<h3>" + T.title + ": result</h3><p>" + summary + "</p>" +
        "<p class='muted'>Share of gaze samples" + (mode === "task2" ? " (last 2 s before click)" : "") + ":</p>" +
        "<table>" + rows + "</table>" +
        "<div class='row actions'><button id='hm'>Toggle heatmap (H)</button><button class='secondary' id='dl'>Gaze CSV</button>" +
        "<button class='secondary' onclick='location.reload()'>Run again</button><a class='btn secondary' href='index.html'>Steps</a></div>";
      res.style.display = "block";

      var heat = document.getElementById("heat"), shown = false;
      window.toggleHeatmap = function () { shown = !shown; if (shown) drawHeatmap(heat, pts, mode === "task2" ? 30 : 50); heat.style.display = shown ? "block" : "none"; };
      document.getElementById("hm").onclick = window.toggleHeatmap;
      document.getElementById("dl").onclick = function () {
        var s = getSession(); downloadText("gaze-" + mode + "-" + s.participant + "-" + s.condition + ".csv", pointsToCSV(pts));
      };
    });
  });
}
