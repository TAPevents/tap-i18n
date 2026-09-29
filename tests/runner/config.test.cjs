const {expect} = require('chai');
const {default: Mocha} = require('mocha');
const config = require('../.mocharc.json');

function suite() {
  const mocha = new Mocha({...config, reporter: function () {}});
  const context = {};
  mocha.suite.emit('pre-require', context, undefined, mocha);
  return {mocha, context};
}

function failures(mocha) {
  return new Promise(resolve => mocha.run(resolve));
}

describe('Test runner - shared Mocha settings', function () {
  it('rejects exclusive tests instead of silently filtering the suite', function () {
    const {context} = suite();
    expect(() => context.it.only('focused test', function () {})).to.throw(/only.*forbidden/i);
  });

  it('fails when a test is skipped', async function () {
    const {mocha, context} = suite();
    context.it.skip('pending test', function () {});
    expect(await failures(mocha)).to.equal(1);
  });

  it('fails an empty suite', async function () {
    expect(await failures(suite().mocha)).to.equal(1);
  });
});
