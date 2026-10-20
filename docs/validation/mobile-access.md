# Mobile validation access — investigation, not test results

Prepared during orchestration on October 19, 2026. The user currently has no reference devices or HTTPS test origin available. T06 has not run and its real-device gate has not passed.

## Practical option

[BrowserStack Live](https://www.browserstack.com/docs/live) provides interactive website testing on real mobile devices. [BrowserStack Local](https://www.browserstack.com/docs/live/local-testing) can connect a locally served app to those sessions, using a provider account/access key and a local tunnel process. It is a candidate for Safari/Chrome, layout, input, and game-side performance measurements.

[Sauce Labs Live Cross Browser](https://docs.saucelabs.com/web-apps/live-testing/live-cross-browser-testing/) is another real-device option. Its [localhost instructions](https://docs.saucelabs.com/secure-connections/sauce-connect-5/guides/localhost-proxying/) require extra hostname setup for real mobile devices. [TestingBot](https://testingbot.com/support/web-automate/mobile) also documents real iOS Safari and Android Chrome browser sessions.

The user reviewed the available subscription and declined paid cloud-device access for this experiment. No account, subscription, tunnel, cloud session, or deployment has been created. Do not acquire paid access as part of the current iteration. Device-dependent checks stay pending until a suitable no-cost or user-owned device path is available; no prices or account entitlements are assumed by this document.

## Evidence still required

- Select explicitly real/physical devices; emulation and resized desktop viewports are not equivalent.
- Provider portrait/landscape controls do not demonstrate physical tilt, calibrated gravity, or full inversion. No documented physical-tilt capability was established by this investigation.
- Verify whether independent simultaneous touches on both pump buttons are available in the chosen session; a documented pinch gesture alone is insufficient evidence.
- Use the game's timing/diagnostics for FPS, not the apparent frame rate of the remote video stream.
- Test actual sensor permission, calibration, and inversion on an appropriate secure origin and real device. These remain unverified even if the remote layout tests pass.

Once access is available, record exact device, OS/browser versions, build, graphics settings, steps, pass/fail/not-run results, and diagnostics in T06's evidence. The later complete-release validation remains a separate task.
