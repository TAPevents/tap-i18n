import {spawn} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {access, cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';
import Mocha from 'mocha';
import {runBrowserTests} from './browser.mjs';
import {preparePackageFixture} from './package-fixture.mjs';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.dirname(testsDir);
const release = process.env.METEOR_RELEASE || '2.16';
const timeout = Number(process.env.TEST_TIMEOUT_MS || 600000);
const cases = [
  {name: 'disabled', files: false},
  {name: 'package-api', files: false, packageTests: true, scenario: 'disabled'},
  {name: 'inferred'},
  {name: 'catalog-initialization', files: false, catalogProbe: true},
  {name: 'configured', config: {
    helper_name: 'tr_project', i18n_files_route: '/fixture-translations',
    supported_languages: ['cc-CC', 'cc', 'fr', 'cc']
  }},
  {name: 'preloaded', config: {preloaded_langs: ['*']}},
  {name: 'raw-config', config: {supported_languages: ['CC-cc']}},
  {name: 'package', namespaced: true},
  {name: 'package-configured', namespaced: true, config: {}, scenario: 'package'},
  {name: 'mixed-formats', namespaced: true, mixedFormats: true, config: {}, scenario: 'package'},
  {name: 'late-package-config', namespaced: true, lateConfig: true, error: 'package-tap.i18n should be loaded before languages files'},
  {name: 'duplicate-package-config', namespaced: true, duplicateConfig: true, error: 'More than one package-tap.i18n found for package'},
  {name: 'invalid-case', invalidFile: 'cc-cc.i18n.json', error: "Can't recognise 'cc-cc' as a language-tag"},
  {name: 'client-file', invalidFile: 'client/en.i18n.json', error: 'Languages files should be common to the server and the client'},
  {name: 'server-file', invalidFile: 'server/en.i18n.json', error: 'Languages files should be common to the server and the client'},
  {name: 'invalid-config', config: {supported_languages: 'cc'}, error: 'The field supported_languages of project-tap.i18n has to be of type'}
];
const requested = process.argv.slice(2);
if (requested.includes('--list')) {
  console.log(cases.map(item => item.name).join('\n'));
  process.exit(0);
}
if (requested.some(name => !cases.some(item => item.name === name))) {
  throw new Error('Unknown scenario. Use npm test --prefix tests -- --list to list scenarios.');
}
if (!Number.isFinite(timeout) || timeout <= 0) throw new Error('TEST_TIMEOUT_MS must be positive.');
const selected = cases.filter(item => !requested.length || requested.includes(item.name));
// The same strict settings govern host tests and both Meteor test environments.
const mochaConfig = JSON.parse(await readFile(path.join(testsDir, '.mocharc.json'), 'utf8'));
const hostSuite = new Mocha(mochaConfig);
hostSuite.addFile(path.join(testsDir, 'compiler/batches.test.cjs'));
hostSuite.addFile(path.join(testsDir, 'runner/browser.test.cjs'));
hostSuite.addFile(path.join(testsDir, 'runner/config.test.cjs'));
hostSuite.addFile(path.join(testsDir, 'runner/package-fixture.test.cjs'));
await new Promise((resolve, reject) => hostSuite.run(failures => {
  if (failures) reject(new Error(`${failures} host tests failed.`));
  else resolve();
}));
const workspace = await mkdtemp(path.join(os.tmpdir(), 'tap-i18n-tests-'));
let browser;
let activeChild;
let activeMongo;
let succeeded = false;

// A separate Chrome process/profile belongs to this run; never attach to a user's browser.
async function chromePath() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const candidates = process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium']
    : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch {}
  }
  throw new Error('Set CHROME_BIN to an installed Chrome/Chromium executable.');
}

async function availablePorts() {
  // Meteor uses three consecutive ports. Check all three before handing them to
  // Meteor; this detects existing listeners, but is not an atomic reservation.
  for (let attempt = 0; attempt < 30; attempt++) {
    const port = 20000 + Math.floor(Math.random() * 30000);
    const sockets = [];
    try {
      for (let offset = 0; offset < 3; offset++) {
        const socket = net.createServer();
        sockets.push(socket);
        await new Promise((resolve, reject) => {
          socket.once('error', reject);
          socket.listen(port + offset, '127.0.0.1', resolve);
        });
      }
      return port;
    } catch {
      // Try a different block if any listener already owns one of the ports.
    } finally {
      await Promise.all(sockets.map(socket => new Promise(resolve => socket.close(resolve))));
    }
  }
  throw new Error('Could not find three available local ports.');
}

async function prepareFixture(item, directory) {
  const app = path.join(directory, 'app');
  await mkdir(path.join(app, '.meteor'), {recursive: true});
  await mkdir(path.join(app, 'packages'));
  // The package-test app installs its own dependencies. Even the enclosing
  // fixture app must not expose the host's node_modules to Meteor's bundler.
  if (!item.packageTests) {
    await symlink(path.join(testsDir, 'node_modules'), path.join(app, 'node_modules'), 'dir');
  }
  await writeFile(path.join(app, '.meteor/release'), `METEOR@${release}\n`);
  await writeFile(path.join(app, '.meteor/platforms'), 'browser\nserver\n');
  await cp(path.join(testsDir, '.mocharc.json'), path.join(app, '.mocharc.json'));
  const packages = ['meteor-base', 'ecmascript', 'templating', 'jquery', 'underscore', 'tap:i18n', 'meteortesting:mocha@=3.2.0'];
  const testPackage = JSON.parse(await readFile(path.join(testsDir, 'package.json'), 'utf8'));
  // Only app dependencies belong in the Meteor bundle. Keep the modern host
  // runner and compiler harness dependencies outside Meteor's Node runtime.
  const dependencies = {};
  for (const name of ['@babel/runtime', 'chai', 'jquery', 'meteor-node-stubs', 'util']) {
    dependencies[name] = testPackage.devDependencies[name];
  }
  const packageFixture = item.packageTests
    ? await preparePackageFixture(sourceDir, directory, dependencies) : null;
  await symlink(packageFixture ? packageFixture.packageSource : sourceDir,
    path.join(app, 'packages/tap-i18n'), 'dir');
  await writeFile(path.join(app, 'package.json'), JSON.stringify({private: true, dependencies}));
  await cp(path.join(testsDir, 'mocha'), path.join(app, 'app-tests/mocha'), {recursive: true});
  await cp(path.join(testsDir, 'helpers.js'), path.join(app, 'app-tests/helpers.js'));

  if (item.catalogProbe) {
    await cp(path.join(testsDir, 'fixtures/catalog-probe'), path.join(app, 'packages/catalog-probe'), {recursive: true});
    packages.push('tap-i18n-tests:catalog-probe');
  }
  if (item.namespaced) {
    const namespace = path.join(app, 'packages/namespaced');
    await cp(path.join(testsDir, 'fixtures/namespaced'), namespace, {recursive: true});
    packages.push('tap-i18n-tests:namespaced');
    const manifestPath = path.join(namespace, 'package.js');
    let manifest = await readFile(manifestPath, 'utf8');
    if (item.lateConfig) {
      const declaration = "  api.addFiles('package-tap.i18n', ['client', 'server']);";
      manifest = manifest.replace(declaration, '').replace("  api.export('translateFixture');", declaration + "\n  api.export('translateFixture');");
    }
    if (item.duplicateConfig) {
      await mkdir(path.join(namespace, 'duplicate'));
      await cp(path.join(namespace, 'package-tap.i18n'), path.join(namespace, 'duplicate/package-tap.i18n'));
      manifest = manifest.replace("  api.addFiles('package-tap.i18n', ['client', 'server']);", "  api.addFiles('package-tap.i18n', ['client', 'server']);\n  api.addFiles('duplicate/package-tap.i18n', ['client', 'server']);");
    }
    if (item.mixedFormats) {
      // YAML comes first, followed by JSON and then YAML for the same English
      // key. Also create another package to verify namespace isolation.
      const files = ['first.en.i18n.yml', 'middle.en.i18n.json', 'last.en.i18n.yml'];
      await writeFile(path.join(namespace, files[0]), 'ordering: YAML first\n');
      await writeFile(path.join(namespace, files[1]), JSON.stringify({ordering: 'JSON middle'}));
      await writeFile(path.join(namespace, files[2]), 'ordering: YAML last\n');
      manifest = manifest.replace("  api.addFiles(['en.i18n.json'", "  api.addFiles(" + JSON.stringify(files) + ", ['client', 'server']);\n  api.addFiles(['en.i18n.json'");
      const other = path.join(app, 'packages/other');
      await mkdir(other);
      await writeFile(path.join(other, 'package.js'), "Package.describe({name:'tap-i18n-tests:other',version:'0.0.0'}); Package.onUse(function(api) { api.versionsFrom('2.2.4'); api.use(['tap:i18n','templating']); api.addFiles(['package-tap.i18n','en.i18n.json'], ['client','server']); api.export('translateOther'); });");
      await writeFile(path.join(other, 'package-tap.i18n'), JSON.stringify({namespace:'other-fixture',translation_function_name:'translateOther'}));
      await writeFile(path.join(other, 'en.i18n.json'), JSON.stringify({ordering:'Other package'}));
      packages.push('tap-i18n-tests:other');
      await writeFile(path.join(app, 'app-tests/mocha/both/compiler-ordering.app-test.js'), `import {expect} from 'chai'; import {TAPi18n} from 'meteor/tap:i18n'; describe('Compiler ordering regression', function () { it('keeps mixed-format overrides and two namespaces separate', function () { expect(Package['tap-i18n-tests:namespaced'].translateFixture('ordering')).to.equal('YAML last'); expect(Package['tap-i18n-tests:other'].translateOther('ordering')).to.equal('Other package'); expect(TAPi18n.__('ordering')).to.equal('ordering'); }); });`);
    }
    await writeFile(manifestPath, manifest);
  }
  await writeFile(path.join(app, '.meteor/packages'), packages.join('\n') + '\n');
  if (item.config) await writeFile(path.join(app, 'project-tap.i18n'), JSON.stringify(item.config));
  if (item.invalidFile) {
    await mkdir(path.dirname(path.join(app, item.invalidFile)), {recursive: true});
    await writeFile(path.join(app, item.invalidFile), '{"message":"invalid location or tag"}');
  } else if (item.files !== false) {
    await cp(path.join(testsDir, 'fixtures/project'), path.join(app, 'i18n'), {recursive: true});
  }
  return {app, packageFixture};
}

function signalChild(child, signal) {
  if (!child.pid) return;
  try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
}

function startChild(executable, args, options, logPath) {
  const child = spawn(executable, args, {...options, detached: true, stdio: ['ignore', 'pipe', 'pipe']});
  child.log = createWriteStream(logPath);
  child.stdout.pipe(child.log, {end: false});
  child.stderr.pipe(child.log, {end: false});
  child.completion = new Promise(resolve => {
    child.on('error', error => { child.spawnError = error; resolve(); });
    child.on('close', resolve);
  });
  return child;
}

async function stopChild(child) {
  signalChild(child, 'SIGTERM');
  let timer;
  await Promise.race([
    child.completion,
    new Promise(resolve => {
      timer = setTimeout(() => { signalChild(child, 'SIGKILL'); resolve(); }, 5000);
    })
  ]);
  clearTimeout(timer);
  await child.completion;
  await new Promise(resolve => child.log.end(resolve));
}

async function waitForApp(url, child, deadline) {
  // The Meteor proxy starts before compilation finishes. Poll HTTP readiness;
  // no browser/Tracker event exists until the application has been served.
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null || child.spawnError) {
      throw new Error('Meteor exited before the test application became ready.');
    }
    try {
      const response = await fetch(url, {signal: AbortSignal.timeout(2000)});
      const body = await response.text();
      if (response.ok && body.includes('__meteor_runtime_config__')) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Timed out waiting for the Meteor test application.');
}

async function runScenario(item) {
  const directory = path.join(workspace, item.name);
  await mkdir(directory);
  const {app, packageFixture} = await prepareFixture(item, directory);
  const settings = path.join(directory, 'settings.json');
  await writeFile(settings, JSON.stringify({public: {
    tapI18nTestScenario: item.scenario || item.name,
    tapI18nBenchmark: process.env.BENCHMARK === '1' && item.name === 'inferred'
  }}));
  const port = await availablePorts();
  const url = `http://127.0.0.1:${port}/`;
  const env = {...process.env};
  // Always use this disposable test app's local Mongo and the explicit source
  // package paths. Never inherit an application's DB, settings, or overrides.
  for (const key of ['MONGO_URL', 'MONGO_OPLOG_URL', 'METEOR_SETTINGS', 'METEOR_PACKAGE_DIRS', 'PACKAGE_DIRS', 'NODE_OPTIONS']) delete env[key];
  env.ROOT_URL = url;
  env.METEOR_NO_RELEASE_CHECK = '1';
  env.PWD = app;
  // Run server tests first and use the standard Mocha manual-browser mode.
  // Our Node runner opens Chrome, checks both reports, and owns process exit.
  env.TEST_WATCH = '1';
  env.TEST_SERVER = '1';
  env.TEST_CLIENT = '1';
  delete env.TEST_BROWSER_DRIVER;
  delete env.TEST_PARALLEL;
  delete env.MOCHA_GREP;
  delete env.MOCHA_INVERT;
  delete env.COVERAGE;
  env.SERVER_TEST_REPORTER = 'json';
  env.CLIENT_TEST_REPORTER = 'json';
  env.SERVER_MOCHA_OUTPUT = path.join(directory, 'server-results.json');
  env.MOCHA_TIMEOUT = '10000';
  let mongo;
  if (process.env.MONGOD_BIN) {
    const dbPath = path.join(directory, 'mongo-db');
    await mkdir(dbPath);
    mongo = startChild(process.env.MONGOD_BIN, ['--bind_ip', '127.0.0.1', '--port', String(port + 2),
      '--dbpath', dbPath], {cwd: directory, env}, path.join(directory, 'mongo.log'));
    activeMongo = mongo;
    env.MONGO_URL = `mongodb://127.0.0.1:${port + 2}/tap_i18n_tests`;
  }
  const args = ['--release', release,
    ...(item.packageTests ? ['test-packages', packageFixture.packageSource, '--test-app-path', packageFixture.packageApp] : ['test', '--full-app']),
    '--once', '--headless',
    '--driver-package', 'meteortesting:mocha', '--exclude-archs', 'web.browser.legacy',
    '--disable-oplog', '--port', `127.0.0.1:${port}`, '--settings', settings];
  console.log(`Running ${item.name} (Meteor ${release})`);
  const child = startChild(process.env.METEOR_BIN || 'meteor', args, {cwd: app, env}, path.join(directory, 'meteor.log'));
  activeChild = child;
  let timer;
  try {
    const deadline = Date.now() + timeout;
    const work = async () => {
      if (item.error) {
        await child.completion;
        // Flush pending log writes before checking the compiler diagnostic.
        await new Promise(resolve => child.log.write('', resolve));
        const output = await readFile(path.join(directory, 'meteor.log'), 'utf8');
        if (!Number.isInteger(child.exitCode) || child.exitCode === 0 || child.spawnError || !output.includes(item.error)) {
          throw new Error(`Expected compiler rejection containing: ${item.error}`);
        }
        return 'expected compiler rejection';
      }
      await waitForApp(url, child, deadline);
      const client = await runBrowserTests(browser, url, deadline, directory);
      const serverResults = JSON.parse(await readFile(path.join(directory, 'server-results.json'), 'utf8'));
      if (!Number.isInteger(serverResults.stats.tests) || serverResults.stats.tests <= 0 ||
          serverResults.stats.failures !== 0 || serverResults.stats.pending !== 0) {
        throw new Error(JSON.stringify({stats: serverResults.stats,
          failures: serverResults.failures.map(test => ({test: test.fullTitle, error: test.err.message}))}, null, 2));
      }
      return {server: serverResults.stats.tests, client};
    };
    const pending = [
      work(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Scenario timed out after ${timeout} ms`)), timeout); })
    ];
    if (mongo) pending.push(mongo.completion.then(() => { throw new Error('Native Mongo exited; see mongo.log.'); }));
    const result = await Promise.race(pending);
    await writeFile(path.join(directory, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(`PASS ${item.name}: ${typeof result === 'string' ? result : `${result.server} server, ${result.client} client tests`}`);
  } catch (error) {
    const output = await readFile(path.join(directory, 'meteor.log'), 'utf8');
    console.error(output.slice(-12000));
    throw error;
  } finally {
    clearTimeout(timer);
    await stopChild(child);
    activeChild = undefined;
    if (mongo) await stopChild(mongo);
    activeMongo = undefined;
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    if (activeChild) await stopChild(activeChild);
    if (activeMongo) await stopChild(activeMongo);
    if (browser) await browser.close();
    console.error(`Interrupted; diagnostics retained at ${workspace}`);
    process.exit(signal === 'SIGINT' ? 130 : 143);
  });
}

try {
  console.log(`Test workspace: ${workspace}`);
  if (selected.some(item => !item.error)) {
    browser = await puppeteer.launch({executablePath: await chromePath(), headless: true});
    console.log(`Browser: ${await browser.version()}`);
  }
  const failures = [];
  for (const item of selected) {
    try { await runScenario(item); }
    catch (error) { failures.push(item.name); console.error(`FAIL ${item.name}: ${error.stack || error}`); }
  }
  succeeded = failures.length === 0;
  if (succeeded) console.log(`All ${selected.length} scenarios passed.`);
  else throw new Error(`${selected.length - failures.length}/${selected.length} scenarios passed; failed: ${failures.join(', ')}`);
} catch (error) {
  console.error(error.stack || error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (succeeded && !process.env.KEEP_TEST_TMP) await rm(workspace, {recursive: true, force: true});
  else console.log(`Logs and generated fixture applications: ${workspace}`);
}
