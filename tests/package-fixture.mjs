import {cp, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

// test-packages installs npm dependencies in its generated app. Meteor can
// merge package/app dependencies through symlinks while bundling; keep that
// entire graph separate from the host runner's installed dependencies.
export async function preparePackageFixture(sourceDir, directory, dependencies) {
  const packageSource = path.join(directory, 'package-source');
  const packageApp = path.join(directory, 'package-app');
  const excluded = new Set(['.git', '.npm', '.meteor', 'node_modules']);
  await cp(sourceDir, packageSource, {
    recursive: true,
    filter: entry => !path.relative(sourceDir, entry).split(path.sep)
      .some(part => excluded.has(part) || part.startsWith('.build'))
  });
  await mkdir(packageApp);
  // Avoid Meteor's default skeleton ranges drifting beyond our tested pins.
  await writeFile(path.join(packageApp, 'package.json'),
    JSON.stringify({private: true, dependencies}, null, 2) + '\n');
  return {packageSource, packageApp};
}
