// playwright/saveLinkedinSession.ts
import { chromium } from 'playwright'

;

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://www.linkedin.com/login');
  // eslint-disable-next-line no-console
  console.log('🔐 请手动登录 LinkedIn，然后关闭页面');

  await page.waitForTimeout(60000);
  await context.storageState({ path: './linkedin_cookies.json' });

  await browser.close();
})();
