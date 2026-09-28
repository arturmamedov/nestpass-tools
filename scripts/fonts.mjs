// Copies the hub's fonts out of the pinned @fontsource packages into web/fonts/.
// web/ is uploaded to the host as it is, so the copies are committed; tests/fonts.spec.ts
// fails when they drift from the packages (bump the version in package.json, then rerun this).
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** [package, file] pairs: the only faces the hub page declares in hub.css. */
export const FONTS = [
  ['@fontsource/montserrat', 'montserrat-latin-500-normal.woff2'],
  ['@fontsource/montserrat', 'montserrat-latin-600-normal.woff2'],
  ['@fontsource/montserrat', 'montserrat-latin-700-normal.woff2'],
  ['@fontsource/archivo-black', 'archivo-black-latin-400-normal.woff2'],
];

/** Both fonts are under the SIL Open Font License, which asks for the licence to travel with them. */
export const LICENSES = [
  ['@fontsource/montserrat', 'LICENSE', 'LICENSE-montserrat.txt'],
  ['@fontsource/archivo-black', 'LICENSE', 'LICENSE-archivo-black.txt'],
];

export const source = (pkg, file) => join(root, 'node_modules', pkg, file.endsWith('.woff2') ? 'files' : '', file);
export const target = (file) => join(root, 'web', 'fonts', file);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(join(root, 'web', 'fonts'), { recursive: true });
  for (const [pkg, file] of FONTS) copyFileSync(source(pkg, file), target(file));
  for (const [pkg, file, as] of LICENSES) copyFileSync(source(pkg, file), target(as));
  console.log(`copied ${FONTS.length} fonts and ${LICENSES.length} licences into web/fonts/`);
}
