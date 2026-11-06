/* Hub page: session settings, results table, CSV export. */
(function () {
  var s = getSession();
  var pEl = document.getElementById("participant"), cEl = document.getElementById("condition");
  pEl.value = s.participant; cEl.value = s.condition;
  function save() {
    setSession({ participant: pEl.value.trim() || "P1", condition: cEl.value });
    document.getElementById("saved").textContent = "Saved: " + sessionLabel();
  }
  pEl.addEventListener("input", save); cEl.addEventListener("change", save); save();

  var cols = ["time", "participant", "condition", "test", "hits", "trials", "hit_rate", "mean_error_px", "clicked", "detail", "viewport"];
  function render() {
    var rows = Store.get("wg_results", []);
    var t = document.getElementById("tbl");
    if (!rows.length) { t.innerHTML = "<tr><td class='muted'>No results yet.</td></tr>"; return; }
    t.innerHTML = "<tr>" + cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr>" +
      rows.slice().reverse().map(function (r) {
        return "<tr>" + cols.map(function (c) {
          var v = r[c] === undefined ? "" : r[c];
          if (c === "time") v = String(v).replace("T", " ").slice(0, 19);
          return "<td>" + String(v).replace(/</g, "&lt;") + "</td>";
        }).join("") + "</tr>";
      }).join("");
  }
  render();

  document.getElementById("csv").onclick = function () {
    var rows = Store.get("wg_results", []);
    var esc = function (v) { v = v === undefined ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    downloadText("webgazer-results.csv", cols.join(",") + "\n" + rows.map(function (r) { return cols.map(function (c) { return esc(r[c]); }).join(","); }).join("\n"));
  };
  document.getElementById("clearRes").onclick = function () {
    if (confirm("Delete ALL saved results? Download the CSV first.")) { Store.set("wg_results", []); render(); }
  };
  document.getElementById("clearCal").onclick = function () {
    try { indexedDB.deleteDatabase("localforage"); } catch (e) {}
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf("localforage") === 0 || k.indexOf("webgazer") === 0) localStorage.removeItem(k); }); } catch (e) {}
    this.textContent = "Calibration cleared";
  };
  tagClarity("hub");
})();
