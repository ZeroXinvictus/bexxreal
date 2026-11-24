# bexxreal

> **Note:** This is a fork of [puppeteer-real-browser](https://github.com/zfcsoftware/puppeteer-real-browser) with significant enhancements for Cloudflare Challenge Platform compatibility, reflektor bypass, and improved behavior simulation.

<p align="center">
  <h3 align="center">bexxreal — Undetectable Puppeteer Browser</h3>
  <p align="center">
    Bypasses bot detection in services like Cloudflare Turnstile, Challenge Platform, and Reflektor.
    Behaves like a real browser with enhanced stealth capabilities.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/cloudflare-turnstile%20%E2%9C%85-passing-brightgreen.svg" alt="Turnstile" />
  <img src="https://img.shields.io/badge/reflektor%E2%80%8B-bypassed-brightgreen.svg" alt="Reflektor" />
</p>

## Installation

If you are using a Linux operating system, xvfb must be installed for the library to work correctly.

```bash
npm i bexxreal
```

if you are using linux:

```bash
sudo apt-get install xvfb
```

## What's New in v2.0.0

- **New Cloudflare Challenge Platform support** — Updated turnstile solver for the latest `challenges.cloudflare.com` API, supporting both iframe-based and classic widget structures
- **Reflektor bypass** — Enhanced fingerprint randomization, WebGL spoofing, canvas noise injection, plugin array realism, and native code toString patching
- **Improved behavior simulation** — Human-like delays on navigation, clicking, and evaluation; subtle scroll jitter after page loads
- **Multiple Turnstile detection strategies** — Cascading fallback from hidden input → class selector → bounding-box heuristic → broad element scan
- **Cloudflare WAF challenge page detection** — Auto-detects and attempts to click through the "Just a moment..." JS challenge
- **iFrame mutation observer** — Automatically patches webdriver flag in dynamically injected iframes
- **Script injection interceptor** — Blocks suspicious scripts containing puppeteer/webdriver/cypress signatures

## Include

### CommonJS

```js
const { connect } = require("bexxreal");

const start = async () => {
  const { page, browser } = await connect();
};
```

### Module

```js
import { connect } from "bexxreal";

const { page, browser } = await connect();
```

## Usage

```js
const { connect } = require("bexxreal");

async function test() {
  const { browser, page } = await connect({
    headless: false,
    args: [],
    customConfig: {},
    turnstile: true,
    connectOption: { defaultViewport: null },
    disableXvfb: false,
    ignoreAllFlags: false,
    enhancedStealth: true,
    // proxy: { host: '...', port: ..., username: '...', password: '...' }
  });

  // Use enhanced navigation helper for human-like delays
  await page.bexxrealGoTo("<url>", { waitUntil: "networkidle2" });

  // Or use normal methods — all clicks get randomized delays automatically
  await page.goto("<url>");
}

test();
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `headless` | `false` | Browser headless mode. `"new"`, `"shell"`, or `false`. Most stable with `false`. |
| `args` | `[]` | Additional Chrome flags |
| `customConfig` | `{}` | chrome-launcher config (e.g. `userDataDir`, `chromePath`) |
| `proxy` | `{}` | Proxy with `host`, `port`, optional `username`/`password` |
| `turnstile` | `false` | Enable automatic Cloudflare Turnstile solving |
| `connectOption` | `{}` | Options passed to `puppeteer.connect()` |
| `disableXvfb` | `false` | Disable virtual display on Linux |
| `plugins` | `[]` | Puppeteer-extra plugins to load |
| `ignoreAllFlags` | `false` | Override all default Chrome flags (skips stealth flag additions) |
| `enhancedStealth` | `true` | Enable reflektor bypass patches (canvas noise, WebGL spoof, etc.) |

### Enhanced Page Methods

When `connect()` returns a page, it includes extra helpers:

- `page.bexxrealGoTo(url, options)` — Same as `page.goto()` but with a human-like delay before navigation and subtle scroll jitter after load
- `page.bexxrealEvaluate(fn, ...args)` — Same as `page.evaluate()` but with a short delay before execution
- `page.realClick(selector, options)` — Natural mouse cursor click via ghost-cursor (recommended over `page.click()`)
- `page.click(selector, options)` — Now includes randomized delay before clicking

## How to Install Puppeteer-extra Plugins?

Some plugins may cause detection. You can verify compatibility using the test file.

Example:

```bash
npm i puppeteer-extra-plugin-click-and-wait
```

```js
const { connect } = require("bexxreal");

const { page, browser } = await connect({
  args: ["--start-maximized"],
  turnstile: true,
  headless: false,
  customConfig: {},
  connectOption: { defaultViewport: null },
  plugins: [require("puppeteer-extra-plugin-click-and-wait")()],
});
await page.goto("https://google.com", { waitUntil: "domcontentloaded" });
await page.realClick("body");
await browser.close();
```

## Docker

```bash
git clone https://github.com/bexxreal/bexxreal
cd bexxreal
docker build -t bexxreal .
docker run bexxreal
```

## License

Distributed under the MIT License.

## Disclaimer

This software is intended for educational and informational purposes only. Users should use this software at their own risk. The developer cannot be held liable for any damages resulting from the use of this software.
