const {expect} = require('chai');
const {access, mkdir, mkdtemp, readFile, rm, symlink, writeFile} = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

describe('Test runner - package fixture isolation', function () {
  let directory, source, preparePackageFixture;
  before(async function () { ({preparePackageFixture} = await import('../package-fixture.mjs')); });
  beforeEach(async function () {
    directory = await mkdtemp(path.join(os.tmpdir(), 'tap-i18n-package-fixture-'));
    source = path.join(directory, 'source');
    await mkdir(path.join(source, 'tests/mocha'), {recursive: true});
    await writeFile(path.join(source, 'package.js'), 'original package');
    await writeFile(path.join(source, 'tests/mocha/example.js'), 'original test');
  });
  afterEach(async function () { await rm(directory, {recursive: true, force: true}); });

  it('copies editable source without linking npm dependencies or build state', async function () {
    const excluded = ['.git', '.npm', '.meteor', '.build.test', 'node_modules', 'tests/node_modules'];
    const shared = path.join(directory, 'shared-dependencies');
    await mkdir(shared);
    await writeFile(path.join(shared, 'dependency.js'), 'original dependency');
    for (const entry of excluded) await symlink(shared, path.join(source, entry), 'dir');

    const fixture = await preparePackageFixture(source, directory, {});
    expect(await readFile(path.join(fixture.packageSource, 'tests/mocha/example.js'), 'utf8'))
      .to.equal('original test');
    for (const entry of excluded) {
      let error;
      try { await access(path.join(fixture.packageSource, entry)); } catch (caught) { error = caught; }
      expect(error, entry).to.have.property('code', 'ENOENT');
    }
    await writeFile(path.join(fixture.packageSource, 'package.js'), 'fixture change');
    await mkdir(path.join(fixture.packageApp, 'node_modules'));
    await writeFile(path.join(fixture.packageApp, 'node_modules/dependency.js'), 'installed dependency');
    expect(await readFile(path.join(source, 'package.js'), 'utf8')).to.equal('original package');
    expect(await readFile(path.join(shared, 'dependency.js'), 'utf8')).to.equal('original dependency');
  });

  it('seeds the generated app with the exact fixture dependency versions', async function () {
    const dependencies = {'@babel/runtime': '7.28.4', chai: '4.5.0', 'meteor-node-stubs': '1.2.30'};
    const {packageApp} = await preparePackageFixture(source, directory, dependencies);
    const manifest = JSON.parse(await readFile(path.join(packageApp, 'package.json'), 'utf8'));
    expect(manifest).to.deep.equal({private: true, dependencies});
  });
});
