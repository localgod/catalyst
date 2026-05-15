// tsc does not copy non-TS assets. Mirror src/assets → dist/assets so the
// bundled fonts ship with the package and resolve at runtime (../assets/fonts
// relative to the compiled module, same as under src for tests).
import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const from = `${root}/src/assets`;
const to = `${root}/dist/assets`;
if (existsSync(from)) {
  cpSync(from, to, { recursive: true });
  console.log(`copied src/assets → dist/assets`);
}
