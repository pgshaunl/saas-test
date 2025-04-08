/* eslint-disable regexp/no-unused-capturing-group */
import { chromium } from 'playwright';

export async function scrapeLinkedinSearch(url: string) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: './linkedin_cookies.json',
  });

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  const domContent = await page.evaluate(() => {
    return document.documentElement.innerHTML;
  });
  // eslint-disable-next-line no-console
  console.log(domContent);
  await page.waitForSelector('.search-results-container');

  const results = await page.$$eval(
    'div.search-results-container ul[role="list"] > li',
    (nodes) => {
      return nodes.map((node) => {
        // Name
        const nameSpan = node.querySelector('span[dir="ltr"] > span[aria-hidden="true"]');
        const name = nameSpan?.textContent?.trim() || null;

        // Profile URL
        const profileAnchor = node.querySelector('a[href*="/in/"]');
        const profileUrl = profileAnchor?.getAttribute('href') || null;

        // Avatar
        const avatarImg = node.querySelector('img.EntityPhoto-circle-3');
        const avatar = avatarImg?.getAttribute('src') || null;

        // Title & Location: walk all <div> and extract best guesses
        const divs = Array.from(node.querySelectorAll('div')).map(div => div.textContent?.trim()).filter(Boolean);

        let title = null;
        let location = null;

        for (const text of divs) {
          if (!title && text && /\b(Founder|CEO|CTO|Engineer|Manager|Head|Lead)\b/i.test(text) && text.length < 100) {
            title = text;
          }

          if (!location && text && /\b(Hong Kong|Singapore|Tokyo|Beijing|Shanghai|SAR|China|Seoul|New York|London)\b/i.test(text)) {
            location = text;
          }

          if (title && location) {
            break;
          }
        }

        return {
          name,
          title,
          location,
          avatar,
          profileUrl: profileUrl ? `https://www.linkedin.com${profileUrl}` : null,
        };
      });
    },
  );

  return results;
}
