const {expect} = require('chai');
const {EventEmitter} = require('node:events');
const {mkdtemp, readFile, rm} = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

// Drive the browser completion/report protocol without starting Chrome. The real
// Meteor fixture matrix covers the same adapter with an actual browser.
function browserFixture(options = {}) {
  const page = new EventEmitter();
  const state = {closed: false};
  page.setDefaultTimeout = () => {};
  page.goto = async () => {
    page.emit('console', {text: () => 'diagnostic before completion'});
    if (options.pageError) page.emit('pageerror', new Error(options.pageError));
    if (options.navigationError) throw new Error(options.navigationError);
  };
  page.waitForFunction = async () => {
    if (options.report) page.emit('console', {text: () => JSON.stringify(options.report)});
    if (options.completionError) throw new Error(options.completionError);
  };
  page.evaluate = async () => options.failures === undefined ? 0 : options.failures;
  return {state, browser: {createBrowserContext: async () => ({
    newPage: async () => page,
    close: async () => { state.closed = true; }
  })}};
}

function passingReport(overrides = {}) {
  return {stats: {tests: 1, failures: 0, pending: 0, ...overrides}, tests: [{}], failures: []};
}

describe('Test runner - browser results and diagnostics', function () {
  let directory, runBrowserTests;
  before(async function () { ({runBrowserTests} = await import('../browser.mjs')); });
  beforeEach(async function () { directory = await mkdtemp(path.join(os.tmpdir(), 'tap-i18n-browser-test-')); });
  afterEach(async function () { await rm(directory, {recursive: true, force: true}); });

  async function run(fixture) {
    return runBrowserTests(fixture.browser, 'http://127.0.0.1:1/', Date.now() + 1000, directory);
  }

  it('accepts a completed passing report, saves it and closes the context', async function () {
    const fixture = browserFixture({report: passingReport()});
    expect(await run(fixture)).to.equal(1);
    expect(fixture.state.closed).to.equal(true);
    expect(JSON.parse(await readFile(path.join(directory, 'client-results.json'), 'utf8'))).to.deep.equal(passingReport());
  });

  for (const phase of ['navigationError', 'completionError']) {
    it('retains console output and page errors after ' + phase, async function () {
      const fixture = browserFixture({[phase]: 'probe timeout', pageError: 'page diagnostic'});
      let error;
      try { await run(fixture); } catch (caught) { error = caught; }
      expect(error).to.be.an('error').with.property('message', 'probe timeout');
      const log = await readFile(path.join(directory, 'client.log'), 'utf8');
      expect(log).to.include('diagnostic before completion').and.include('page diagnostic');
      expect(fixture.state.closed).to.equal(true);
    });
  }

  for (const [name, options] of [
    ['missing report', {}],
    ['failed assertion', {report: passingReport({failures: 1}), failures: 1}],
    ['pending test', {report: passingReport({pending: 1})}],
    ['empty suite', {report: passingReport({tests: 0})}],
    ['browser failure count', {report: passingReport(), failures: 1}],
    ['page error', {report: passingReport(), pageError: 'uncaught exception'}]
  ]) {
    it('rejects ' + name + ' and still closes the browser context', async function () {
      const fixture = browserFixture(options);
      let error;
      try { await run(fixture); } catch (caught) { error = caught; }
      expect(error).to.be.an('error');
      expect(fixture.state.closed).to.equal(true);
      expect(await readFile(path.join(directory, 'client.log'), 'utf8')).to.include('diagnostic before completion');
    });
  }
});
