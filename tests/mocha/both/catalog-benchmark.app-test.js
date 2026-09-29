import {expect} from 'chai';
import {Meteor} from 'meteor/meteor';
import {TAPi18n} from 'meteor/tap:i18n';

// Opt-in measurements: correctness is asserted, elapsed time is never a gate.
if ((Meteor.settings.public || {}).tapI18nBenchmark) describe('TAPi18n - catalog benchmark', function () {
  this.timeout(30000);
  it('measures fresh copies and warm shared reads at several catalog sizes', function () {
    const previous = {conf: TAPi18n.conf, names: TAPi18n.languages_names};
    const iterations = 50000;
    const now = Meteor.isServer
      ? () => Number(process.hrtime.bigint()) / 1e6
      : () => performance.now();
    let consumed = 0;
    function measure(getter) {
      const started = now();
      for (let index = 0; index < iterations; index++) consumed += getter().en.name.length;
      return (now() - started) * 1000 / iterations;
    }
    const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
    try {
      const results = [];
      for (const size of [4, 64, 256]) {
        TAPi18n.conf = {supported_languages: null};
        TAPi18n.languages_names = {en: ['English', 'English']};
        for (let index = 1; index < size; index++) {
          TAPi18n.languages_names['x-' + index] = ['English name ' + index, 'Local name ' + index];
        }
        TAPi18n.invalidateLanguagesCache();
        const snapshot = TAPi18n.getLanguagesCached();
        expect(snapshot).to.deep.equal(TAPi18n.getLanguages());
        const fresh = () => TAPi18n.getLanguages();
        const cached = () => TAPi18n.getLanguagesCached();
        for (let index = 0; index < 1000; index++) { fresh(); cached(); }
        const copies = [], hits = [];
        // Alternate sample order to reduce warmup/order effects.
        for (let index = 0; index < 5; index++) {
          if (index % 2) { hits.push(measure(cached)); copies.push(measure(fresh)); }
          else { copies.push(measure(fresh)); hits.push(measure(cached)); }
        }
        expect(cached()).to.equal(snapshot);
        results.push({languages: size, iterations, samples: 5,
          freshMicroseconds: median(copies), cachedMicroseconds: median(hits)});
      }
      expect(consumed).to.be.greaterThan(0);
      console.log(JSON.stringify({tapI18nBenchmark: Meteor.isServer ? 'server' : 'client', results}));
    } finally {
      TAPi18n.conf = previous.conf;
      TAPi18n.languages_names = previous.names;
      TAPi18n.invalidateLanguagesCache();
    }
  });
});
