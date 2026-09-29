import {expect} from 'chai';
import {TAPi18n, TAPi18next} from 'meteor/tap:i18n';
import {Tracker} from 'meteor/tracker';
import {TapI18nTest, asPromise} from '../../helpers';

describe('TAPi18n - cached catalog reactivity', function () {
  let previous, computations;
  beforeEach(function () {
    previous = {conf: TAPi18n.conf, names: TAPi18n.languages_names};
    computations = [];
    TAPi18n.conf = {supported_languages: null};
    TAPi18n.languages_names = {en: ['English', 'English']};
    TAPi18n.invalidateLanguagesCache();
  });
  afterEach(function () {
    computations.forEach(computation => computation.stop());
    TAPi18n.conf = previous.conf;
    TAPi18n.languages_names = previous.names;
    TAPi18n.invalidateLanguagesCache();
    Tracker.flush();
  });

  it('tracks cache misses and hits, including a reader rerunning after another filled the cache', function () {
    const runs = [0, 0];
    const snapshots = [];
    for (let index = 0; index < 2; index++) {
      computations.push(Tracker.autorun(() => {
        runs[index]++;
        snapshots[index] = TAPi18n.getLanguagesCached();
      }));
    }
    expect(snapshots[0]).to.equal(snapshots[1]);
    const first = snapshots[0];
    TAPi18n.languages_names.en[1] = 'English override';
    Tracker.flush();
    expect(runs).to.deep.equal([1, 1]);
    TAPi18n.invalidateLanguagesCache();
    Tracker.flush();
    expect(runs).to.deep.equal([2, 2]);
    expect(snapshots[0]).to.equal(snapshots[1]).and.not.to.equal(first);
    expect(snapshots[1].en.name).to.equal('English override');
    TAPi18n.conf.supported_languages = [];
    TAPi18n.invalidateLanguagesCache();
    Tracker.flush();
    expect(runs).to.deep.equal([3, 3]);
  });

  it('tracks disabled reads and automatically invalidates when the library enables the project', function () {
    TAPi18n.conf = null;
    TAPi18n.invalidateLanguagesCache();
    let runs = 0, snapshot;
    computations.push(Tracker.autorun(() => { runs++; snapshot = TAPi18n.getLanguagesCached(); }));
    expect(snapshot).to.equal(null);
    TAPi18n._enable({helper_name: '_', supported_languages: null});
    Tracker.flush();
    expect(runs).to.equal(2);
    expect(snapshot.en.name).to.equal('English');
    TAPi18n.conf = null;
    TAPi18n.invalidateLanguagesCache();
    Tracker.flush();
    expect(runs).to.equal(3);
    expect(snapshot).to.equal(null);
  });

  it('keeps legacy reads nonreactive while cached reads react to membership changes', function () {
    let legacyRuns = 0, cachedRuns = 0, snapshot;
    computations.push(Tracker.autorun(() => { legacyRuns++; TAPi18n.getLanguages(); }));
    computations.push(Tracker.autorun(() => { cachedRuns++; snapshot = TAPi18n.getLanguagesCached(); }));
    TAPi18n.languages_names.fr = ['French', 'Français'];
    TAPi18n.invalidateLanguagesCache();
    Tracker.flush();
    expect(legacyRuns).to.equal(1);
    expect(cachedRuns).to.equal(2);
    expect(snapshot.fr.name).to.equal('Français');
    TAPi18n.conf.supported_languages = [];
    TAPi18n.invalidateLanguagesCache();
    Tracker.flush();
    expect(legacyRuns).to.equal(1);
    expect(cachedRuns).to.equal(3);
    expect(snapshot.fr).to.equal(undefined);
  });
});

if (TapI18nTest.regularCatalog()) describe('TAPi18n - cached catalog and translation updates', function () {
  it('retains the snapshot and computation on selection and resource changes', async function () {
    const namespace = 'tap-test-cached-catalog';
    const previous = TAPi18n.getLanguage();
    let runs = 0;
    const snapshot = TAPi18n.getLanguagesCached();
    const computation = Tracker.autorun(() => { runs++; TAPi18n.getLanguagesCached(); });
    try {
      await asPromise(TAPi18n.setLanguage('cc-CC'));
      TAPi18n.loadTranslations({'cc-CC': {message: 'updated'}}, namespace);
      Tracker.flush();
      expect(runs).to.equal(1);
      expect(TAPi18n.getLanguagesCached()).to.equal(snapshot);
      expect(TAPi18n._getPackageI18nextProxy(namespace)('message')).to.equal('updated');
    } finally {
      computation.stop();
      if (TAPi18n._loadTranslations_cache['cc-CC']) delete TAPi18n._loadTranslations_cache['cc-CC'][namespace];
      TAPi18next.removeResourceBundle('cc-CC', namespace);
      await asPromise(TAPi18n.setLanguage(previous));
    }
  });
});
