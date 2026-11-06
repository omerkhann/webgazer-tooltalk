/* Step 0: 9-point click calibration (the only page where clicks train WebGazer). */
(async function () {
  document.getElementById("hud").textContent = sessionLabel();
  var go = document.getElementById("go");
  try {
    await startGaze({ training: true, showDot: false });
    // fresh calibration every time this page is used
    try { await webgazer.clearData(); } catch (e) {}
  } catch (e) {
    go.textContent = "Camera failed: " + (e && e.message ? e.message : e);
    return;
  }
  var mark = faceWatch(document.getElementById("noface"));
  onGaze(function (p) { if (p) mark(); });
  go.disabled = false; go.textContent = "Start calibration";

  go.onclick = function () {
    document.getElementById("intro").style.display = "none";
    var pos = [10, 50, 90], remaining = 9;
    pos.forEach(function (y) { pos.forEach(function (x) {
      var d = document.createElement("div"); d.className = "dot";
      d.style.left = x + "vw"; d.style.top = y + "vh";
      var n = 0;
      d.addEventListener("click", function () {
        if (d.classList.contains("done")) return;
        n++; d.style.opacity = String(1 - n * 0.12);
        if (n >= 5) { d.classList.add("done"); d.style.opacity = "1"; remaining--;
          if (!remaining) setTimeout(function () {
            document.querySelectorAll(".dot").forEach(function (x) { x.remove(); });
            webgazer.showPredictionPoints(true);
            document.getElementById("done").style.display = "flex";
            tagClarity("calibrate");
          }, 300);
        }
      });
      document.body.appendChild(d);
    }); });
  };
})();
