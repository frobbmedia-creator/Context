/**
 * Single source of truth for the package version.
 * Read from package.json at module load so the version exported in every
 * context bundle, the CLI --version flag, and the trial artifact all agree.
 *
 * Loaded with `import { APP_VERSION, BUILD_ID } from './version.js';`
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(here, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

export const APP_VERSION = pkg.version;
export const PACKAGE_NAME = pkg.name;
export const BUILD_ID = 'cli-killer-v3';
