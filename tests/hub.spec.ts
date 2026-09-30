import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BAR_HEIGHT, HUB, KIT, defined, expect, root, test } from './fixtures';
import { FONTS, LICENSES, source, target } from '../scripts/fonts.mjs';

type Entry = { id: string; name: string; href: string; preview?: string };
type Registry = { hub: string; tools: Entry[]; apps: Entry[] };
const registry = (page: Page) => page.evaluate(() => (window as unknown as { NestTools: Registry }).NestTools);

test('the hub draws one card per registered tool, from the registry', async ({ page, errors }) => {
  await page.goto(HUB);
  await defined(page);
  const { tools } = await registry(page);
  const cards = page.locator('#tools .card');
  await expect(cards).toHaveCount(tools.length);
  for (const [i, tool] of tools.entries()) {
    const link = cards.nth(i).getByRole('link', { name: tool.name, exact: true });
    await expect(link).toHaveAttribute('href', tool.href);
  }
  await expect(cards.first().locator('.card-place')).toHaveText('nestpass.ai/activities');
  // The hub is not a tool: nothing is marked current.
  await expect(page.locator('nest-nav [aria-current]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the apps get their own row below the tools, each card led by a preview, and stay out of the bar', async ({ page, errors }) => {
  await page.goto(HUB);
  await defined(page);
  const { tools, apps } = await registry(page);
  expect(apps.map((a) => a.id)).toEqual(['analytics', 'wsuite']);
  const cards = page.locator('#apps .card');
  await expect(cards).toHaveCount(apps.length);
  for (const [i, app] of apps.entries()) {
    const card = cards.nth(i);
    await expect(card.getByRole('link')).toHaveCount(1);
    await expect(card.getByRole('link', { name: app.name, exact: true })).toHaveAttribute('href', app.href);
    // The app's screenshot, served from the hub; until it has one, a placeholder of the same size.
    const preview = card.locator('.card-preview');
    await expect(preview).toBeVisible();
    if (app.preview) {
      const img = preview.locator('img');
      await expect(img).toHaveAttribute('src', new URL(app.preview, HUB).href);
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth), app.id).toBeGreaterThan(0);
    } else await expect(preview.locator('svg')).toBeVisible();
  }
  const [toolsBox, appsBox] = [(await page.locator('#tools').boundingBox())!, (await page.locator('#apps').boundingBox())!];
  expect(appsBox.y).toBeGreaterThan(toolsBox.y + toolsBox.height);
  // The bar is the switcher between the staff tools only.
  const barLinks = await page.locator('nest-nav a').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  expect(barLinks.length).toBeGreaterThan(tools.length);
  for (const app of apps) expect(barLinks).not.toContain(app.href);
  expect(errors).toEqual([]);
});

test('the hub is public but asks search engines to stay away', async ({ page }) => {
  await page.goto(HUB);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('robots.txt turns every crawler away from the whole domain, AI crawlers by name too', async ({ page }) => {
  // Through the page, not page.request: only the page's requests go through the fixture's routes.
  const res = (await page.goto(`${HUB}robots.txt`))!;
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toMatch(/^text\/plain/);
  // Groups: consecutive User-agent lines, then their rules. Every group must disallow everything.
  const groups: { agents: string[]; rules: string[] }[] = [];
  for (const line of (await res.text()).split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim()).filter(Boolean)) {
    const [field, value] = line.split(/:\s*/, 2);
    if (/^user-agent$/i.test(field)) {
      const last = groups.at(-1);
      if (last && last.rules.length === 0) last.agents.push(value);
      else groups.push({ agents: [value], rules: [] });
    } else groups.at(-1)!.rules.push(`${field.toLowerCase()}:${value}`);
  }
  for (const group of groups) expect(group.rules, group.agents.join(', ')).toEqual(['disallow:/']);
  const agents = groups.flatMap((g) => g.agents);
  for (const name of ['*', 'GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'PerplexityBot']) expect(agents).toContain(name);
});

test('the hub renders in its own fonts, with no third-party requests', async ({ page, context }) => {
  const outside: string[] = [];
  context.on('request', (r) => !r.url().startsWith(HUB) && outside.push(r.url()));
  await page.goto(HUB);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('400 40px "Archivo Black"'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('600 13px Montserrat'))).toBe(true);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Archivo Black/);
  expect(outside).toEqual([]);
});

test('whole cards are the link, and the Open pill is not a second one', async ({ page }) => {
  await page.goto(HUB);
  await defined(page);
  const card = page.locator('#tools .card').first();
  await expect(card.getByRole('link')).toHaveCount(1);
  const box = (await card.boundingBox())!;
  await card.click({ position: { x: box.width - 30, y: box.height - 20 } });
  await expect(page).toHaveURL('https://nestpass.ai/activities/');
});

test('without the kit, the hub keeps its 54 px strip', async ({ page, context }) => {
  await context.route(KIT, (route) => route.abort());
  await page.goto(HUB);
  const nav = page.locator('nest-nav');
  await expect(nav).toHaveText('Nests tools');
  expect(await nav.evaluate((n) => n.getBoundingClientRect().height)).toBe(BAR_HEIGHT);
});

test('web/fonts holds exactly the pinned @fontsource files (npm run fonts)', () => {
  for (const [pkg, file] of FONTS) expect(readFileSync(target(file)).equals(readFileSync(source(pkg, file))), file).toBe(true);
  for (const [pkg, file, as] of LICENSES) expect(readFileSync(target(as)).equals(readFileSync(source(pkg, file))), as).toBe(true);
  expect(readFileSync(join(root, 'web', 'hub.css'), 'utf8').match(/url\(fonts\/[^)]+\)/g)?.length).toBe(FONTS.length);
});
