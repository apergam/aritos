# T06 — Mobile POC validation record

Status: **free baseline executed — physical-device acceptance pending**. Updated October 20, 2026. Tested accepted lab build `f930b866` (source `e7b12a3`, code unchanged from integration `c346c1b`) in the Codex in-app desktop browser. T06 does not block other implementation. This report distinguishes current desktop/fixture observations from earlier engine evidence and not-run hardware checks.

## Access and registration

Use [free browser/automated/emulator paths](mobile-access.md) first. Actual-device access via free quota or a borrowed phone is optional; missing access stays not run without blocking the free baseline. No paid subscription, billing activation or overage is authorized.

## Free baseline checklist

The parent executed the free baseline on October 20. Prior evidence is reused only with its original build/date; it is not relabeled as a new physical-device run.

| Work | Evidence to record | Current status |
| --- | --- | --- |
| Input/session/physics regressions, active-time comparison and twelve-ring classic soak | Current input/session checks: 16/16 passed. Unchanged physics uses the prior 600-second / 72,000-step classic soak and 42-test integration at `f930b866`; [evidence](integration-t01-t05.md). | pass, with prior engine evidence explicitly reused |
| Phone/tablet viewport portrait/landscape, both models/rules, accessible controls | 390×844, 844×390, 768×1024, 1024×768; no horizontal page overflow, pumps below tank. Both models/rules retain 1/2 in drop scene after rotating viewport. [Bounds](evidence/t06-layouts.json), [model/rule results](evidence/t06-model-rules.json). | pass for state/overlap; lab landscape scrolling defect below |
| Emulated tilt/inversion/remapping and synthetic permission/no-data transitions | `tests/input.test.ts` plus prior physics gravity vectors cover calibration/remap/manual inversion/denial/invalid data/late permission. Current run uses deterministic fixtures, not DevTools hardware injection. | pass, automated fixtures only |
| Pump edges, focus/cancel, simultaneous commands and manual tilt plus pumping | Eight focused input tests cover one pulse, independent pointer IDs, key repeat/focus/cancel and manual tilt; session tests cover allowed model pumps. | pass, synthetic input |
| Available local OS emulator checks | No full Xcode or Android Studio installation/adb found. No large installation or account setup performed. | not run, optional |
| Findings and follow-up manifest | Landscape lab scroll issue assigned to T07; actual devices remain unavailable. Production responsive regression belongs to T12. | recorded |

## Current run and finding

Evidence class: desktop viewport emulation and deterministic Node fixtures. Browser user agent reports Chrome 155 on Macintosh; pixel ratio 2. The four exact viewport bounds are in the JSON manifest. Screenshots: [phone portrait](evidence/t06-lab-390x844.png), [phone landscape](evidence/t06-lab-844x390.png), [tablet portrait](evidence/t06-lab-768x1024.png), [tablet landscape](evidence/t06-lab-1024x768.png).

**Finding T06-01:** the old laboratory needs vertical scrolling in short landscape. At 844×390, tank bottom is 560.90 px and pump bottom is 641.90 px; at 1024×768, pump bottom is 969.03 px. This is not horizontal clipping or pump/tank overlap, but is inconvenient for play. Resolved in the production layout and verified by T12 across six viewport sizes, including 360×640 and 844×390; see [release evidence](release.md). The lab remains an explicit diagnostic view. No mobile FPS claim is inferred from desktop layout testing.

Current command: `node --import tsx --test tests/input.test.ts tests/session.test.ts`, 16/16 passed. No engine tuning changed. Actual permission grant, physical tilt and two physical fingers remain not run. T06's baseline is complete with the production finding subsequently resolved, not a declaration that every mobile criterion passed.

## Physical run registration

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
