import type { Page } from '@playwright/test';
import { BAR_HEIGHT, HOST, KIT, defined, expect, test } from './fixtures';

const HOSTS = ['blank', 'flyers-like', 'qr-like', 'newsletter-like'];

type Entry = { id: string; name: string; href: string; bar?: false };
type Registry = { hub: string; tools: Entry[]; apps: Entry[] };
const registry = (page: Page) => page.evaluate(() => (window as unknown as { NestTools: Registry }).NestTools);

/** What a person sees of the bar: the shadow parts every host must render identically. */
function barLook(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector('nest-nav')!;
    const root = host.shadowRoot!;
    const pick = (selector: string, props: string[]) => {
      const node = root.querySelector(selector)!;
      const style = getComputedStyle(node);
      return Object.fromEntries(props.map((p) => [p, style.getPropertyValue(p)]));
    };
    const text = ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
      'word-spacing', 'text-transform', 'text-indent', 'text-shadow', 'white-space', 'background-color', 'padding', 'height'];
    return {
      host: host.getBoundingClientRect().height,
      bar: pick('.bar', text),
      logo: pick('.logo img', ['height', 'width', 'background-color', 'border-top-width']),
      link: pick(".links a:not([aria-current])", text),
      current: pick(".links a[aria-current='page']", text),
    };
  });
}

test.describe('the registry', () => {
  test('every tool id marks exactly its own link as the current page', async ({ page }) => {
    await page.goto(`${HOST}blank.html`);
    await defined(page);
    const all = (await registry(page)).tools;
    expect(all.map((t) => t.id)).toEqual(['flyers', 'maps', 'qr', 'vanity', 'occupancy', 'newsletter']);
    // `bar: false` keeps a tool to its card on the tools page.
    const tools = all.filter((t) => t.bar !== false);
    expect(tools.map((t) => t.id)).toEqual(['flyers', 'qr', 'vanity', 'newsletter']);
    for (const tool of tools) {
      await page.evaluate((id) => document.querySelector('nest-nav')!.setAttribute('tool', id), tool.id);
      const links = page.locator('nest-nav .links a');
      await expect(links).toHaveCount(tools.length);
      await expect(page.locator("nest-nav .links a[aria-current='page']")).toHaveText([tool.name]);
      expect(await links.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href))).toEqual(tools.map((t) => t.href));
    }
  });

  test('a missing or unknown tool still renders, with nothing marked current', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto(`${HOST}blank.html`);
    await defined(page);
    for (const change of ['nope', null]) {
      await page.evaluate((value) => {
        const nav = document.querySelector('nest-nav')!;
        if (value === null) nav.removeAttribute('tool');
        else nav.setAttribute('tool', value);
      }, change);
      await expect(page.locator('nest-nav [aria-current]')).toHaveCount(0);
      await expect(page.locator('nest-nav .menu')).toHaveText('Tools');
    }
  });

  test('links point at https addresses, and the logo and "All tools" at the hub the kit came from', async ({ page }) => {
    await page.goto(`${HOST}blank.html`);
    await defined(page);
    const { hub, tools, apps } = await registry(page);
    expect(hub).toBe('https://nestpass.ai/');
    for (const entry of [...tools, ...apps]) expect(entry.href).toMatch(/^https:\/\//);
    await expect(page.locator('nest-nav .logo')).toHaveAttribute('href', hub);
    await expect(page.locator('nest-nav .all')).toHaveAttribute('href', hub);
    await expect(page.locator('nest-nav .logo img')).toHaveJSProperty('naturalWidth', 300);
  });
});

test.describe('any tool can host it', () => {
  test('the bar looks the same on every host page, at the contract height', async ({ page }) => {
    const looks = [];
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 800 });
      for (const host of HOSTS) {
        await page.goto(`${HOST}${host}.html`);
        await defined(page);
        const look = await barLook(page);
        expect(look.host, `${host} at ${width}px`).toBe(BAR_HEIGHT);
        looks.push({ width, host, look });
      }
    }
    for (const { width, host, look } of looks) {
      const blank = looks.find((l) => l.width === width && l.host === 'blank')!.look;
      expect(look, `${host} at ${width}px`).toEqual(blank);
    }
  });

  test("from 900 px every tool link is inline, beside the widest tool's three actions; below, they fold", async ({ page }) => {
    await page.goto(`${HOST}flyers-like.html`);
    await defined(page);
    // QR's real actions, the widest: "Dashboard", a "+ New QR code" pill, "Sign out".
    await page.evaluate(() => {
      const nav = document.querySelector('nest-nav > nav')!;
      nav.setAttribute('style', 'display:flex;align-items:center;gap:18px;font-size:13px');
      nav.innerHTML = '<a href="#">Dashboard</a><a class="btn" href="#" style="padding:8px 14px">+ New QR code</a><a href="#">Sign out</a>';
    });
    const measure = () =>
      page.evaluate(() => {
        const root = document.querySelector('nest-nav')!.shadowRoot!;
        const links = root.querySelector('.links')!.getBoundingClientRect();
        const own = document.querySelector('nest-nav > nav')!.getBoundingClientRect();
        return { apart: own.left - links.right, inside: own.right <= innerWidth, menu: getComputedStyle(root.querySelector('.menu')!).display };
      });
    await page.setViewportSize({ width: 900, height: 700 });
    const wide = await measure();
    expect(wide.menu).toBe('none');
    expect(wide.apart).toBeGreaterThanOrEqual(16);
    expect(wide.inside).toBe(true);
    await page.setViewportSize({ width: 899, height: 700 });
    await expect(page.locator('nest-nav .menu')).toBeVisible();
    await expect(page.locator('nest-nav .links')).toBeHidden();
  });

  test('the tool keeps its own actions; its fallback brand hides once the bar is defined', async ({ page }) => {
    await page.goto(`${HOST}flyers-like.html`);
    await defined(page);
    await expect(page.getByRole('link', { name: 'Library' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New', exact: true })).toBeVisible();
    await expect(page.locator('nest-nav > .brand')).toBeHidden();
  });

  test('without the kit, the tool shows its own fallback at the same height', async ({ page, context }) => {
    await context.route(KIT, (route) => route.abort());
    await page.goto(`${HOST}flyers-like.html`);
    await expect(page.locator('nest-nav > .brand')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Library' })).toBeVisible();
    expect(await page.locator('nest-nav').evaluate((n) => n.getBoundingClientRect().height)).toBe(BAR_HEIGHT);
    expect(await page.evaluate(() => customElements.get('nest-nav'))).toBeUndefined();
  });
});

test.describe('it leaves the page alone', () => {
  test('no document styles, fonts or light-DOM changes, and loading it twice is harmless', async ({ page, errors }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${HOST}probe.html`);
    // A .btn outside the bar: the ones slotted into the bar inherit its font on purpose.
    await page.evaluate(() => document.querySelector('main')!.insertAdjacentHTML('beforeend', '<a class="btn" id="outside" href="#">Outside</a>'));
    // The bar grows from its fallback to 54 px, so sizes derived from layout may change; nothing else may.
    const layout = new Set(['block-size', 'height', 'inline-size', 'width', 'perspective-origin', 'transform-origin']);
    const snapshot = () =>
      page.evaluate((skip) => {
        const style = (selector: string) => {
          const s = getComputedStyle(document.querySelector(selector)!);
          return Array.from(s)
            .filter((p) => !skip.includes(p))
            .map((p) => `${p}:${s.getPropertyValue(p)}`)
            .join(';');
        };
        return {
          sheets: document.styleSheets.length,
          adopted: document.adoptedStyleSheets.length,
          fonts: document.fonts.size,
          body: style('body'),
          btn: style('#outside'),
          text: style('.text'),
          globals: Object.keys(window).filter((k) => k.startsWith('Nest')),
        };
      }, [...layout]);
    const before = await snapshot();
    await page.evaluate(() => {
      const w = window as unknown as { mutations: MutationRecord[] };
      w.mutations = [];
      new MutationObserver((records) => w.mutations.push(...records)).observe(document.querySelector('nest-nav')!, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
    await page.addScriptTag({ url: KIT });
    await page.addScriptTag({ url: KIT });
    await defined(page);
    // Use it: open and close the menu, change the tool.
    await page.locator('nest-nav .menu').click();
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.querySelector('nest-nav')!.setAttribute('tool', 'qr'));
    const after = await snapshot();
    expect(after).toEqual({ ...before, globals: ['NestTools'] });
    // The one attribute change is the test's own.
    const mutations = await page.evaluate(() =>
      (window as unknown as { mutations: MutationRecord[] }).mutations.map((m) => `${m.type}:${m.attributeName}`),
    );
    expect(mutations).toEqual(['attributes:tool']);
    await expect(page.locator('nest-nav .bar')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test('the links fold into a menu that opens, closes on Escape and on an outside click', async ({ page }) => {
    await page.goto(`${HOST}blank.html`);
    await defined(page);
    const menu = page.locator('nest-nav .menu');
    const panel = page.locator('nest-nav .panel');
    await expect(page.locator('nest-nav .links')).toBeHidden();
    await expect(menu).toHaveText('Flyers');
    await expect(menu).toHaveCSS('text-transform', 'uppercase');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');

    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.tool .name')).toHaveText(['Flyers', 'QR codes', 'Social vanity URLs', 'Newsletter']);
    await expect(panel.locator(".tool[aria-current='page'] .name")).toHaveText('Flyers');
    await expect(panel.getByRole('link', { name: /All tools/ })).toBeVisible();

    // The panel sits above the page's own positioned content.
    const box = (await panel.boundingBox())!;
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName, [box.x + box.width / 2, box.y + box.height - 20]);
    expect(hit).toBe('NEST-NAV');

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.querySelector('nest-nav')!.shadowRoot!.activeElement?.className)).toBe('menu');

    await menu.click();
    await expect(panel).toBeVisible();
    await page.locator('.below').click({ position: { x: 20, y: 380 } });
    await expect(panel).toBeHidden();

    // A click inside the panel that is not a link leaves it open.
    await menu.click();
    await panel.click({ position: { x: 3, y: 3 } });
    await expect(panel).toBeVisible();
  });

  test("at 360 px the menu and a tool's two actions sit side by side, apart", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await page.goto(`${HOST}flyers-like.html`);
    await defined(page);
    // Flyers' real actions, at their real size: "Library" and a "New flyer" pill.
    await page.evaluate(() => {
      const nav = document.querySelector('nest-nav > nav')!;
      nav.setAttribute('style', 'display:flex;align-items:center;gap:12px');
      nav.lastElementChild!.textContent = 'New flyer';
    });
    const gap = await page.evaluate(() => {
      const menu = document.querySelector('nest-nav')!.shadowRoot!.querySelector('.menu')!.getBoundingClientRect();
      const own = document.querySelector('nest-nav > nav')!.getBoundingClientRect();
      return { apart: own.left - menu.right, inside: own.right <= innerWidth };
    });
    expect(gap.apart).toBeGreaterThanOrEqual(8);
    expect(gap.inside).toBe(true);
  });

  test('the menu closes when the bar leaves the page', async ({ page }) => {
    await page.goto(`${HOST}blank.html`);
    await defined(page);
    await page.locator('nest-nav .menu').click();
    await page.evaluate(() => {
      const nav = document.querySelector('nest-nav')!;
      nav.remove();
      document.body.prepend(nav);
    });
    await expect(page.locator('nest-nav .panel')).toBeHidden();
    await expect(page.locator('nest-nav .menu')).toHaveAttribute('aria-expanded', 'false');
  });
});
