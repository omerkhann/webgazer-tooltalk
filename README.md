# WebGazer Tool Talk: Test Site

Team D13 Cactus · CS-3014 Applied HCI · Fall 2026

A static test site comparing **WebGazer.js** (webcam eye tracking) with **Microsoft Clarity** (click and scroll analytics). It has calibration, two accuracy checks with automatic scoring, and two usability tasks on a mock news homepage. *The Cactus Courier* and its stories are made up for this demonstration.

## Pages
| Page | Purpose |
|---|---|
| `index.html` | Hub: set participant and condition, links to each step, results table, CSV export |
| `calibrate.html` | Step 0: 9-point click calibration (the only page where clicks train WebGazer) |
| `grid.html?size=2` | Step 1: big targets (2×2), 8 trials, hit rate and mean error calculated automatically |
| `grid.html?size=6` | Step 2: small targets (6×6), same procedure |
| `task1.html` | Task 1: "click the story you'd read first". Gaze share per story vs. the click |
| `task2.html` | Task 2: "click Sports" in a dense menu. Gaze spread across links in the last 2 s |

Keys on test pages: **D** gaze dot · **H** heatmap (after a run) · **V** camera preview (shows your face, so keep it off while recording).

## Project layout
```
index.html, calibrate.html, grid.html, task1.html, task2.html
assets/
  css/     style.css (all pages), news.css (mock news page)
  js/      config.js (Clarity ID), common.js (shared helpers), one script per page
  fonts/   IBM Plex, self-hosted
vendor/    third-party code, don't edit: webgazer/, mediapipe/
```
Pages stay at the root so their published URLs don't change. The mock news page is the test stimulus: changing its fonts, sizes or spacing moves the targets, so re-run the tasks after any such change.

## Method notes (say these in the talk)
- A **hit** means more than 50% of gaze samples during a trial fell inside the lit square. The first 0.5 s of each 3 s trial is ignored while the eyes move to the target.
- Mouse and click training is **switched off** on test pages, so WebGazer can't learn the answers from where people click.
- The gaze dot is hidden during measured runs so participants can't chase it. Turn it on with D only for demo recordings, and don't use those runs as data.
- Participants are team members who know the page. This is a demonstration, not a user study.

## Run locally (for testing)
WebGazer needs `https` or `localhost`. Opening the file directly won't start the camera.
```
cd webgazer-tooltalk
python -m http.server 8000
```
Then open http://localhost:8000 in Chrome. Clarity won't record on localhost, so use the hosted version for the Clarity runs.

## Publish on GitHub Pages
1. Create a **public** repository on GitHub, e.g. `webgazer-tooltalk`.
2. **Add file → Upload files**, then drag in the *contents* of this folder (all files and the `assets` and `vendor` folders). Commit.
3. **Settings → Pages → Source: Deploy from a branch → `main` / root → Save.**
4. After about a minute the site is live at `https://<username>.github.io/webgazer-tooltalk/`.

## Connect Microsoft Clarity
1. Sign in at https://clarity.microsoft.com → **New project** → enter the GitHub Pages URL.
2. Copy the **project ID**, the short code at the end of `https://www.clarity.ms/tag/XXXXXXX` in the setup snippet.
3. Paste it into `assets/js/config.js` (`CLARITY_ID: "XXXXXXX"`) and upload that file again.
4. Every session is tagged with `participant`, `condition` and `page`, so you can filter by them in Clarity's dashboard.
5. Clarity data isn't instant. Do a test visit and check the dashboard before relying on it.

## Credits
- WebGazer.js v3.5.3 © Brown HCI Group, GPL-3.0 (see `vendor/webgazer/LICENSE.md`). Papoutsaki et al., *WebGazer: Scalable Webcam Eye Tracking Using User Interactions*, IJCAI 2016.
- Includes MediaPipe Face Mesh model files distributed with WebGazer.
- IBM Plex Sans and IBM Plex Serif © IBM Corp., SIL Open Font License 1.1 (see `assets/fonts/OFL.txt`).
- Site code written with AI assistance (Claude) and reviewed by the team. Disclose this in the contribution statement.
