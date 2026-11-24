import { launch, Launcher } from "chrome-launcher";
import puppeteer from "rebrowser-puppeteer-core";
import { pageController } from "./module/pageController.mjs";

export async function connect({
args = [],
headless = false,
customConfig = {},
proxy = {},
turnstile = false,
connectOption = {},
disableXvfb = false,
plugins = [],
ignoreAllFlags = false,
enhancedStealth = true,
} = {}) {
let xvfbsession = null;
if (headless == "auto") headless = false;

if (process.platform === "linux" && disableXvfb === false) {
try {
const { default: Xvfb } = await import("xvfb");
xvfbsession = new Xvfb({
silent: true,
xvfb_args: ["-screen", "0", "1920x1080x24", "-ac"],
});
xvfbsession.startSync();
} catch (err) {
console.log(
"You are running on a Linux platform but do not have xvfb installed. The browser can be captured. Please install it with the following command\n\nsudo apt-get install xvfb\n\n" +
err.message
);
}
}

let chromeFlags;
if (ignoreAllFlags === true) {
chromeFlags = [
...args,
...(headless !== false ? [`--headless=${headless}`] : []),
...(proxy && proxy.host && proxy.port
? [`--proxy-server=${proxy.host}:${proxy.port}`]
: []),
];
} else {
const flags = Launcher.defaultFlags();
const indexDisableFeatures = flags.findIndex((flag) => flag.startsWith('--disable-features'));
flags[indexDisableFeatures] = `${flags[indexDisableFeatures]},AutomationControlled`;
const indexComponentUpdateFlag = flags.findIndex((flag) => flag.startsWith('--disable-component-update'));
flags.splice(indexComponentUpdateFlag, 1);
const indexEnableAutomation = flags.findIndex((flag) => flag.startsWith('--enable-automation'));
if (indexEnableAutomation !== -1) flags.splice(indexEnableAutomation, 1);
const idxBlink = flags.findIndex((flag) => flag.startsWith('--disable-blink-features'));
if (idxBlink !== -1) {
flags[idxBlink] = flags[idxBlink].replace(/,?AutomationControlled/g, '');
if (flags[idxBlink] === '--disable-blink-features') flags.splice(idxBlink, 1);
}
chromeFlags = [
...flags,
...args,
...(headless !== false ? [`--headless=${headless}`] : []),
...(proxy && proxy.host && proxy.port
? [`--proxy-server=${proxy.host}:${proxy.port}`]
: []),
"--no-sandbox",
"--disable-dev-shm-usage",
"--disable-features=IsolateOrigins,site-per-process,OptimizationGuideModelDownloading,OptimizationHintsFetching,OptimizationTargetPrediction,ShortcutsHintingService,TranslationService,ChromePredictorPreload",
"--disable-site-isolation-trials",
"--disable-features=TranslateUI",
"--disable-extensions-service",
"--disable-background-networking",
"--disable-sync",
"--disable-default-apps",
"--no-first-run",
"--no-default-browser-check",
];
}
const chrome = await launch({
ignoreDefaultFlags: true,
chromeFlags,
...customConfig,
});
let pextra = null;
if (plugins.length > 0) {
const { addExtra } = await import("puppeteer-extra");
pextra = addExtra(puppeteer);
for (const item of plugins) {
pextra.use(item);
}
}

const browser = await (pextra ? pextra : puppeteer).connect({
browserURL: `http://127.0.0.1:${chrome.port}`,
...connectOption,
});

let [page] = await browser.pages();

let pageControllerConfig = {
browser,
page,
proxy,
turnstile,
xvfbsession,
pid: chrome.pid,
plugins,
enhancedStealth,
};

page = await pageController({
...pageControllerConfig,
chrome,
killProcess: true,
});

browser.on("targetcreated", async (target) => {
if (target.type() === "page") {
let newPage = await target.page();
pageControllerConfig.page = newPage;
newPage = await pageController(pageControllerConfig);
}
});

return {
browser,
page,
};
}
