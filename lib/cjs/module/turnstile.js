const checkTurnstile = ({ page }) => {
  return new Promise(async (resolve, reject) => {
    var waitInterval = setTimeout(() => { clearInterval(waitInterval); resolve(false) }, 8000);
    try {
      
      const elements = await page.$$('[name="cf-turnstile-response"]');
      if (elements.length <= 0) {
        
        
        const widgetContainers = await page.$$('.cf-turnstile, [class*="turnstile-widget"], [class*="cf-turnstile"]');

        if (widgetContainers.length <= 0) {
          
          const coordinates = await page.evaluate(() => {
            let coordinates = [];
            
            document.querySelectorAll('.cf-turnstile, [class*="turnstile"]').forEach(container => {
              container.querySelectorAll('div').forEach(item => {
                try {
                  let rect = item.getBoundingClientRect();
                  let css = window.getComputedStyle(item);
                  if (rect.width > 24 && rect.width <= 36 && rect.height > 24 && rect.height <= 36
                    && css.margin === '0px' && css.padding === '0px' && !item.querySelector('*')) {
                    coordinates.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
                  }
                } catch (e) { }
              });
            });

            
            if (coordinates.length <= 0) {
              document.querySelectorAll('div').forEach(item => {
                try {
                  let rect = item.getBoundingClientRect();
                  let css = window.getComputedStyle(item);
                  if (rect.width >= 24 && rect.width <= 40 && rect.height >= 24 && rect.height <= 40
                    && css.margin === '0px' && css.padding === '0px' && !item.querySelector('*')) {
                    coordinates.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
                  }
                } catch (e) { }
              });
            }

            
            if (coordinates.length <= 0) {
              document.querySelectorAll('*').forEach(item => {
                try {
                  let rect = item.getBoundingClientRect();
                  if (rect.width >= 20 && rect.width <= 50 && rect.height >= 20 && rect.height <= 50
                    && rect.top > 0 && rect.left > 0 && item.offsetParent !== null) {
                    coordinates.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
                  }
                } catch (e) { }
              });
            }

            return coordinates;
          });

          for (const item of coordinates) {
            try {
              let x = item.x + item.w / 2;
              let y = item.y + item.h / 2;
              await page.mouse.click(x, y);
            } catch (err) { }
          }
          return resolve(true);
        }

        
        for (const widget of widgetContainers) {
          try {
            const box = await widget.boundingBox();
            if (box) {
              let x = box.x + box.width / 2;
              let y = box.y + box.height / 2;
              await page.mouse.click(x, y);
            }
          } catch (err) { }
        }
        return resolve(true);
      }

      
      for (const element of elements) {
        try {
          const parentElement = await element.evaluateHandle(el => el.parentElement);
          const box = await parentElement.boundingBox();
          let x = box.x + 30;
          let y = box.y + box.height / 2;
          await page.mouse.click(x, y);
        } catch (err) { }
      }
      clearInterval(waitInterval);
      resolve(true);
    } catch (err) {
      clearInterval(waitInterval);
      resolve(false);
    }
  });
};

const waitForTurnstileToken = ({ page, timeoutMs = 30000 }) => {
  return new Promise(async (resolve) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const token = await page.evaluate(() => {
          try {
            
            let input = document.querySelector('[name="cf-turnstile-response"]');
            if (input && input.value && input.value.length > 20) return input.value;
            
            let widget = document.querySelector('.cf-turnstile[data-challenge-id]');
            if (widget) return widget.getAttribute('data-challenge-id');
            return null;
          } catch (e) {
            return null;
          }
        });
        if (token) {
          resolve(token);
          return;
        }
      } catch (e) {   }
      await new Promise(r => setTimeout(r, 1000));
    }
    resolve(null);
  });
};

const checkCloudflareChallenge = ({ page }) => {
  return new Promise(async (resolve) => {
    try {
      
      const hasJSChallenge = await page.evaluate(() => {
        const title = document.title;
        const bodyText = document.body ? document.body.innerText : '';
        const hasJsCaptcha = !!document.querySelector('#challenge-running, #js-challenge, [id*="challenge"]');
        const hasTurnstileScript = !!document.querySelector('script[src*="turnstile"]');
        const hasCfBody = document.body && document.body.classList.contains('cf-error-details');
        return { title, hasJsCaptcha, hasTurnstileScript, hasCfBody, bodyText: bodyText.substring(0, 200) };
      });

      if (hasCloudflareChallengePage(hasJSChallenge)) {
        
        try {
          const btn = await page.$('input[type="submit"], button[type="submit"], .button, [role="button"]');
          if (btn) {
            await btn.click();
            resolve(true);
            return;
          }
        } catch (e) {   }
      }
      resolve(false);
    } catch (err) {
      resolve(false);
    }
  });
};

function hasCloudflareChallengePage(info) {
  const titles = ['just a moment', 'attention required', 'checking your browser'];
  const texts = ['just a moment', 'checking if the site connection is secure', 'redirecting...'];
  const t = info.title.toLowerCase();
  const b = info.bodyText.toLowerCase();
  return titles.some(t1 => t.includes(t1)) || texts.some(t1 => b.includes(t1)) || info.hasJsCaptcha;
}

module.exports = { checkTurnstile, waitForTurnstileToken, checkCloudflareChallenge };
