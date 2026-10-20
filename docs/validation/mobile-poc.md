# T06 — Mobile POC validation record

Status: **not run — access needed**. Prepared October 19, 2026. T02–T04 are being implemented; this document is a protocol, not acceptance evidence. The user has no reference phones/tablets or authorized HTTPS test origin available and declined paid cloud-device access for this experiment. No paid service will be used in this iteration. See [cloud-device access research](mobile-access.md).

## Access and registration

An interactive real-device service such as BrowserStack Live can cover part of this protocol after an account and local tunnel or authorized HTTPS origin are available. Do not use desktop emulation as real-device evidence. Record unsupported sensor or multitouch actions as not run.

Before each run, fill in:

| Field | Required value |
| --- | --- |
| Run ID / UTC timestamp | Pending |
| Operator / service | Pending |
| Physical device model | Pending |
| OS / browser and exact versions | Pending |
| Build badge / integrated commit | Pending |
| HTTPS origin or authorized local tunnel | Pending |
| Viewport / pixel ratio / graphics settings | Pending |
| Orientation / input method | Pending |
| Model / rule mode / scene | Pending |
| Diagnostic JSON / screenshot or recording paths | Pending |

## Acceptance matrix

All rows currently have status **not run** on Android and iOS. Automated and desktop integration evidence is recorded separately in the task board.

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
| — | — | — | not run | — | Account/device access and secure test origin unavailable |

T06 remains incomplete until the required real-device checks have evidence. Themes, audio and celebration work remains behind this gate. A cloud service may leave sensor calibration, physical inversion, or independent simultaneous-touch checks requiring another real-device path.
