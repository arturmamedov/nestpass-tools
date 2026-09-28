import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { existsSync, statSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('..', import.meta.url));

/** Where the kit and the hub live in production, and a stand-in origin for a tool. */
export const HUB = 'https://nestpass.ai/';
export const KIT = `${HUB}kit/nest-nav.js`;
export const HOST = 'https://tools.test/';

/** The height every tool's fallback copies (README "The contract"). */
export const BAR_HEIGHT = 54;

async function serve(context: BrowserContext, origin: string, dir: string) {
  await context.route(`${origin}**`, (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname);
    const file = normalize(join(dir, path.endsWith('/') ? `${path}index.html` : path));
    if (!file.startsWith(dir + sep) || !existsSync(file) || !statSync(file).isFile()) {
      return route.fulfill({ status: 404, body: 'not found' });
    }
    return route.fulfill({ path: file });
  });
}

type Fixtures = { errors: string[] };

export const test = base.extend<Fixtures>({
  context: async ({ context }, use) => {
    // Routes match newest first: anything not served below is aborted, so nothing leaves the machine.
    await context.route('**', (route) => route.abort());
    await serve(context, HUB, join(root, 'web'));
    await serve(context, HOST, join(root, 'tests', 'hosts'));
    await use(context);
  },
  // Uncaught errors and console errors, for tests that assert a clean page.
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await use(errors);
  },
});

export { expect };

/** Waits until the kit has defined the element and every bar on the page has rendered. */
export async function defined(page: Page) {
  await page.evaluate(() => customElements.whenDefined('nest-nav'));
}
