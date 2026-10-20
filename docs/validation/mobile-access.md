# Free mobile validation access — options, not test results

Updated October 19, 2026 following the user's instruction. T06 now runs in parallel and does not block other implementation. Paid cloud-device access was declined; no subscription, billing activation or paid overage is authorized. See [requirements section 15](../requirements.md#15-free-parallel-validation-decision--october-19-2026).

## Free baseline available without a phone

- [Chrome Device Mode](https://developer.chrome.com/docs/devtools/device-mode) covers viewport/layout, portrait/landscape, touch emulation and CPU/network throttling. It approximates a mobile experience on desktop hardware; it cannot establish physical-phone performance.
- [Chrome Sensors](https://developer.chrome.com/docs/devtools/sensors) can emulate orientation and touch. Pair it with deterministic fixtures for denied/error/no-data paths, cancellation and simultaneous commands. Distinguish emulated input from physical fingers/sensors.
- [Android Emulator](https://developer.android.com/studio/run/emulator) and [Apple's iOS/iPadOS simulators](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios) can add OS/browser compatibility coverage when already available or practical to set up. Installation is not a new prerequisite; emulator speed is not physical-device FPS.
- Existing engine/session/input checks remain useful supporting evidence. Reuse [T01–T05 integration evidence](integration-t01-t05.md), with its exact build/date, rather than relabeling it a new mobile run.

## Optional real-device checks without a subscription

[Android Device Streaming](https://developer.android.com/studio/run/android-device-streaming) provides remote physical Android devices. [Firebase pricing](https://firebase.google.com/pricing) documents 30 no-cost minutes per project per month, including the Spark plan. Check current eligibility and remaining quota before a run; keep within the free allowance and do not upgrade billing. This is an optional access path, not a required account or a complete iOS/sensor solution. Do not assume a remote rotation button proves calibrated physical tilt or independent simultaneous contacts.

A borrowed/user-owned phone can open an authorized temporary HTTPS link through [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/), documented as free testing tunnels without a Cloudflare account/domain. Creating a public tunnel is a separate explicit action: anyone with its URL can access the served app while it runs. No tunnel is created by this planning update.

For nearby hardware, [Chrome USB port forwarding](https://developer.chrome.com/docs/devtools/remote-debugging/local-server) can expose the local server to Android; [Safari Web Inspector](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios) supports inspecting Safari pages on connected iOS/iPadOS devices. Sensor testing must use an appropriate secure context.

## Reporting limits

Record exact tool/browser/OS/build, dimensions, input source and graphics settings. Classify runs as automated, desktop emulation, OS emulator or physical device, with pass/fail/not-run outcomes. Measure FPS inside the game, not from a remote video stream. Physical calibration, full inversion, independent fingers, permission behavior and sustained mobile performance remain pending wherever the access path cannot exercise them.

No new account, tool installation, subscription, tunnel, cloud session or deployment has been created. T06's free baseline may be completed with an evidence report and explicit remaining device checks; unavailable hardware does not block T07–T11 or completion of T12's readiness report. Full mobile acceptance still requires corresponding physical evidence.
