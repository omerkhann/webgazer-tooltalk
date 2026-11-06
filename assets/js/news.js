/* Builds the mock news homepage used by Task 1 and Task 2 (same layout on both).
   Fictional publication and stories, made up for this demonstration. */
var NAV = ["Home", "World", "Pakistan", "Business", "Tech", "Sports", "Science", "Health", "Opinion", "Culture", "Travel", "Weather"];
var STORIES = [
  { id: "Metro (main story)", cls: "s-hero",  tag: "Pakistan", h: "Islamabad metro extends late-night service through winter", p: "Trains will run until 1 a.m. on weekdays from next month, the transit authority said, after a pilot drew strong ridership." },
  { id: "Wi-Fi app",cls: "s-a",     tag: "Tech",     h: "Students build a free app that maps campus Wi-Fi dead zones", p: "The open-source tool crowdsources signal strength from volunteers." },
  { id: "Rupee",cls: "s-b",     tag: "Business", h: "Rupee steadies as remittances hit a seasonal high", p: "Analysts expect the trend to hold through December." },
  { id: "Cricket",cls: "s-c",     tag: "Sports",   h: "Late wicket hands the hosts a series-levelling win", p: "A tense final over decided the third match." },
  { id: "Fog",cls: "s-d",     tag: "Science",  h: "Why fog lingers longer over the plains each winter", p: "Researchers point to a mix of moisture, cold nights and particulates." }
];

function buildNews(root) {
  var nav = NAV.map(function (n) { return '<a href="#" class="navlink" data-nav="' + n + '">' + n + "</a>"; }).join("");
  var stories = STORIES.map(function (s) {
    return '<a href="#" class="story ' + s.cls + '" data-story="' + s.id + '">' +
      '<div class="img"></div><div class="txt"><span class="tag">' + s.tag + "</span><h2>" + s.h + "</h2><p>" + s.p + "</p></div></a>";
  }).join("");
  root.innerHTML =
    '<header class="masthead"><div class="brand">The Cactus Courier</div><div class="date">' +
    new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + "</div></header>" +
    '<nav class="menu">' + nav + "</nav>" +
    '<main class="news">' + stories + "</main>";
}
