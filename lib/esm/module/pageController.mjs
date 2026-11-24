import { createCursor } from 'ghost-cursor';
import { checkTurnstile, waitForTurnstileToken, checkCloudflareChallenge } from './turnstile.mjs';
import kill from 'tree-kill';

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

 
function humanDelay(minMs = 50, maxMs = 300) {
  return new Promise(r => setTimeout(r, getRandomInt(minMs, maxMs)));
}

export async function pageController({ browser, page, proxy, turnstile, xvfbsession, pid, plugins, enhancedStealth = true, killProcess = false, chrome }) {

  let solveStatus = turnstile

  page.on('close', () => {
    solveStatus = false
  });

  browser.on('disconnected', async () => {
    solveStatus = false
    if (killProcess === true) {
      if (xvfbsession) try { xvfbsession.stopSync() } catch (err) { }
      if (chrome) try { chrome.kill() } catch (err) { console.log(err); }
      if (pid) try { kill(pid, 'SIGKILL', () => { }) } catch (err) { }
    }
  });

  
  await page.evaluateOnNewDocument(() => {

    
    Object.defineProperty(MouseEvent.prototype, 'screenX', {
      get: function () { return this.clientX + window.screenX; }
    });
    Object.defineProperty(MouseEvent.prototype, 'screenY', {
      get: function () { return this.clientY + window.screenY; }
    });

    
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
      configurable: true,
    });

    
    if (window.chrome) {
      try {
        const origRuntime = window.chrome.runtime;
        if (origRuntime && !origRuntime.id) {
          Object.defineProperty(window.chrome, 'runtime', {
            get: () => ({ id: undefined }),
            configurable: true,
          });
        }
      } catch (e) { }
    }

    
    const originalQuery = Permissions.query.bind(Permissions);
    Permissions.query = async (permissionName) => {
      if (permissionName === 'notifications') {
        return { state: PermissionState.Denied };
      }
      return originalQuery(permissionName);
    };

    
    const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const ctx = originalCanvasGetContext.apply(this, args);
      if (ctx && args[0] === '2d') {
        const origPutImageData = ctx.putImageData;
        ctx.putImageData = function (imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
          
          const data = imageData.data;
          const step = getRandomInt(4, 16);
          for (let i = 0; i < data.length; i += step) {
            data[i] = Math.max(0, Math.min(255, data[i] + getRandomInt(-1, 1)));
          }
          return origPutImageData.call(this, imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
        };
      }
      return ctx;
    };

    
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (param) {
      if (param === 37445) return 'Google Inc. (NVIDIA)';
      if (param === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Direct3D11 vs_5_0 ps_5_0)';
      return originalGetParameter.call(this, param);
    };

    
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && node.tagName === 'IFRAME') {
            try {
              node.contentWindow.eval(`
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
              `);
            } catch (e) {   }
          }
        }
      }
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

    
    const patchToString = (obj, name) => {
      try {
        const orig = obj[name];
        if (typeof orig === 'function' && orig.toString().includes('[native code]')) {
          Object.defineProperty(obj, name, {
            value: function () { return orig.apply(this, arguments); },
            writable: true,
            configurable: true,
          });
        }
      } catch (e) { }
    };
    patchToString(Navigator.prototype, 'toString');
    patchToString(Document.prototype, 'toString');
    patchToString(Window.prototype, 'toString');

    
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
      configurable: true,
    });
    Object.defineProperty(navigator, 'language', {
      get: () => 'en-US',
      configurable: true,
    });

    
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        return {
          length: 4,
          0: { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          1: { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
          2: { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
          3: { name: 'PDF Viewer', filename: 'default', description: '' },
          namedItem: function(name) { return this[0]; },
          refresh: function() {},
        };
      },
      configurable: true,
    });

    
    const _scriptOpen = HTMLElement.prototype.insertBefore;
    HTMLElement.prototype.insertBefore = function (newNode, refNode) {
      if (newNode.nodeName === 'SCRIPT') {
        try {
          const src = newNode.getAttribute('src') || '';
          if (src.includes('puppeteer') || src.includes('webdriver') || src.includes('cypress')) {
            newNode.textContent = '// intercepted';
            return newNode;
          }
        } catch (e) { }
      }
      return _scriptOpen.call(this, newNode, refNode);
    };

  });

  
  async function turnstileSolver() {
    while (solveStatus) {
      await checkTurnstile({ page }).catch(() => { });
      const token = await waitForTurnstileToken({ page, timeoutMs: 2000 }).catch(() => null);
      if (token) {
        
      }
      await new Promise(r => setTimeout(r, getRandomInt(800, 1500)));
    }
    return;
  }

  turnstileSolver();

  
  if (proxy.username && proxy.password) await page.authenticate({ username: proxy.username, password: proxy.password });

  
  if (plugins.length > 0) {
    for (const plugin of plugins) {
      plugin.onPageCreated(page)
    }
  }

  
  const cursor = createCursor(page);
  page.realCursor = cursor;
  page.realClick = cursor.click;

  
  page.bexxrealGoTo = async (url, options = {}) => {
    await humanDelay(100, 400);
    const result = await page.goto(url, options);
    await page.evaluate(() => {
      window.scrollBy(0, getRandomInt(1, 50));
      window.scrollBy(0, -getRandomInt(1, 50));
    }).catch(() => {});
    return result;
  };

  page.bexxrealEvaluate = async (pageFunction, ...args) => {
    await humanDelay(50, 200);
    return page.evaluate(pageFunction, ...args);
  };

  const origClick = page.click.bind(page);
  page.click = async (selector, options = {}) => {
    await humanDelay(80, 300);
    return origClick(selector, options);
  };

  return page;
}
