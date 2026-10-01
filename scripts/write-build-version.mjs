import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// One value shared by every Next build worker and reused by npm start.
writeFileSync(new URL('../.app-build-version', import.meta.url), randomUUID() + '\n');
