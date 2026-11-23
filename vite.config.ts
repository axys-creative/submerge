import { defineConfig, type Plugin } from 'vite';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// Fills the service worker's file list and cache version after the build.
function serviceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'submerge-sw',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    closeBundle() {
      const files = walk(outDir)
        .map((p) => relative(outDir, p).split('\\').join('/'))
        .filter((f) => f !== 'sw.js' && !f.split('/').pop()!.startsWith('.') &&!f.endsWith('.md') && !f.endsWith('.map'));
      const hash = createHash('sha1');
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const urls = ['./', ...files];
      const sw = join(outDir, 'sw.js');
      writeFileSync(
        sw,
        readFileSync(sw, 'utf8')
          .replace('"__VERSION__"', JSON.stringify(hash.digest('hex').slice(0, 12)))
          .replace('"__PRECACHE__"', JSON.stringify(urls)),
      );
    },
  };
}

// Relative base so the build works on GitHub Pages, itch.io or any subfolder.
export default defineConfig({
  base: './',
  server: { open: true },
  plugins: [serviceWorker()],
});
