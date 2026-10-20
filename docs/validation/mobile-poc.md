# T06 — Mobile POC validation record

Status: **planned — free baseline ready for the next session**. Updated October 19, 2026. T02–T04 are integrated; see [T01–T05 evidence](integration-t01-t05.md). This document is a protocol, not new acceptance evidence. T06 no longer blocks other implementation. No new tests or workers are started by this planning update.

## Access and registration

Use [free browser/automated/emulator paths](mobile-access.md) first. Actual-device access via free quota or a borrowed phone is optional; missing access stays not run without blocking the free baseline. No paid subscription, billing activation or overage is authorized.

## Free baseline checklist

These rows are planned, not completed. Previous desktop/automated evidence may be referenced with its original build and date; new runs require their own records.

| Work | Evidence to record | Current status |
| --- | --- | --- |
| Input/session/physics regressions, active-time comparison and twelve-ring classic soak | Actual commands/build, results, body integrity and engine timing | planned; prior supporting evidence linked above |
| Phone/tablet viewport portrait/landscape, both models/rules, accessible controls | Browser/version, dimensions, screenshots and observed behavior | planned |
| Emulated tilt/inversion/remapping and synthetic permission/no-data transitions | Tool or fixture, steps, expected/actual state; label emulated | planned |
| Pump edges, focus/cancel, simultaneous commands and manual tilt plus pumping | Browser/fixture evidence; label synthetic contacts | planned |
| Available local OS emulator checks | Emulator/OS/browser/build or reason not run | optional |
| Findings and follow-up manifest | Pass/fail/not-run, defects assigned to owners, remaining physical checks | planned |

## Run registration

Before each run, fill in:

| Field | Required value |
| --- | --- |
| Run ID / UTC timestamp | Pending |
| Operator / service | Pending |
| Evidence class / device or emulator model | Pending |
| OS / browser and exact versions | Pending |
| Build badge / integrated commit | Pending |
| HTTPS origin or authorized local tunnel | Pending |
| Viewport / pixel ratio / graphics settings | Pending |
| Orientation / input method | Pending |
| Model / rule mode / scene | Pending |
| Diagnostic JSON / screenshot or recording paths | Pending |

## Physical-device acceptance matrix

All rows currently have status **not run** on physical Android and iOS devices. Use the steps for applicable emulated baseline coverage too, clearly recording its evidence class. Automated/desktop results do not close the corresponding physical-device criteria.

| Coverage | Steps | Expected evidence |
| --- | --- | --- |
| CA-01 | Use drop scene; observe aligned and offset ring. Repeat both models. | Aligned ring threads; offset ring receives no false progress. |
| CA-02 | Use depth scene and alternate camera views. | Front/back screen overlap alone gives no threading or collection. |
| CA-03 | Use classic stack scene; tilt and fully invert, manually and with sensors. | Twelve-ring capacity and physical extraction, with no artificial lock. |
| CA-04 | Press, hold, release and cancel each pump; press both sides with two independent fingers. Pump while tilting. | One pulse per press; both side pulses work together; no stuck input. Record whether cloud service supports the required contacts. |
| CA-05 | Pump repeatedly against walls and during inversion. | No observed body escape, reproducible tunneling or persistent vibration. |
| CA-06 | Run twelve classic rings for ten active minutes. Exercise pumps and orientation throughout. Export diagnostics at start and end. | Twelve active bodies remain; no NaN/escape; sustained game-side FPS at least 30, aiming for 60. Record drops and duration. Collection must not reduce this load. |
| CA-07 | Compare equal active intervals under different drawing schedules; pause/background and return. | Simulation and classic two-second interval agree within fixed-step tolerance; no catch-up backlog. Include automated schedule evidence as supporting evidence only. |
| CA-08 | From explicit activation, grant and deny sensors in separate clean sessions. Exercise no-data/error path where available. | Accurate Spanish status; manual tilt, inversion and pumping remain usable. Record unavailable paths as not run. |
| CA-09 | During an active round, change portrait/landscape and recenter in a comfortable hold; tilt both axes and fully invert. | Round/progress preserved, controls accessible, gravity coherent. Screen rotation alone does not demonstrate physical tilt. |
| CA-10 | Play toward completing the objective with pumping, falling, rotation and tilt on the reference device. | User confirms the water effect recalls the toy and threading is enjoyable. Preserve the accepted desktop feel; record mobile feedback separately. |
| Collect rules | Use collect drop/free scenes; reach pedestal, pump after collection, then restart. | Only sustained threaded pedestal contact collects; total stays initial; progress cannot fall; final collection wins once; restart is fresh. |
| Lifecycle | Overlap manual pause, hidden page and any available menu/confirmation. Cancel then confirm restart. | No active-time advance while paused, cancel preserves state, removing one pause cause leaves others active. |

## Evidence manifest

No device artifacts have been collected. Add one row per actual run; link its exported game diagnostic and proof images/recordings, and name any unresolved defect or unavailable action. Do not infer in-game FPS from the provider's remote video stream.

| Run ID | Device / browser | Build | Result | Diagnostics / proof | Limitations / defects |
| --- | --- | --- | --- | --- | --- |
| — | — | — | not run | — | Physical checks await free access; baseline can proceed independently |

T06 can finish after its required free baseline is executed and reported with explicit pending/not-run physical checks. It is not a prerequisite for UI, themes, audio, celebration or integration. A prepared protocol alone does not complete T06. Full mobile acceptance still requires actual evidence for physical calibration/inversion, independent fingers, permissions and sustained device FPS; unavailable hardware does not prevent further development or a qualified T12 readiness report.
