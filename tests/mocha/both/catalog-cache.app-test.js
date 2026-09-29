import {expect} from 'chai';
import {TAPi18n} from 'meteor/tap:i18n';

describe('TAPi18n - cached language catalog', function () {
  let previous;
  beforeEach(function () {
    previous = {conf: TAPi18n.conf, names: TAPi18n.languages_names};
    TAPi18n.conf = {supported_languages: null};
    TAPi18n.languages_names = {
      en: ['English', 'English'],
      'pt-BR': ['Brazilian Portuguese', 'Português brasileiro']
    };
    TAPi18n.invalidateLanguagesCache();
  });
  afterEach(function () {
    TAPi18n.conf = previous.conf;
    TAPi18n.languages_names = previous.names;
    TAPi18n.invalidateLanguagesCache();
  });

  it('returns null while disabled, including after a previous cached read', function () {
    const first = TAPi18n.getLanguagesCached();
    expect(first.en.name).to.equal('English');
    TAPi18n.conf = null;
    TAPi18n.invalidateLanguagesCache();
    expect(TAPi18n.getLanguagesCached()).to.equal(null);
    expect(TAPi18n.getLanguages()).to.equal(null);
  });

  it('shares a frozen dictionary and frozen records without rereading metadata on hits', function () {
    const snapshot = TAPi18n.getLanguagesCached();
    expect(Object.getPrototypeOf(snapshot)).to.equal(null);
    expect(Object.isFrozen(snapshot)).to.equal(true);
    expect(Object.isFrozen(snapshot.en)).to.equal(true);
    expect(Reflect.set(snapshot.en, 'name', 'changed')).to.equal(false);
    expect(Reflect.set(snapshot.en, '_id', 'en')).to.equal(false);
    expect(Reflect.set(snapshot, 'fr', {})).to.equal(false);
    expect(Reflect.deleteProperty(snapshot, 'en')).to.equal(false);
    Object.defineProperty(TAPi18n.languages_names, 'en', {
      get() { throw new Error('Cache hits must not read metadata'); }, configurable: true
    });
    expect(TAPi18n.getLanguagesCached()).to.equal(snapshot);
    expect(snapshot.en.name).to.equal('English');
  });

  it('keeps legacy results mutable and independent of each other and the shared snapshot', function () {
    const snapshot = TAPi18n.getLanguagesCached();
    const first = TAPi18n.getLanguages();
    const second = TAPi18n.getLanguages();
    expect(first).not.to.equal(second);
    expect(first.en).not.to.equal(second.en).and.not.to.equal(snapshot.en);
    first.en.name = 'Caller display name';
    first.en._id = 'en';
    delete first['pt-BR'];
    expect(second).to.deep.equal(snapshot);
    expect(TAPi18n.getLanguages()).to.deep.equal(snapshot);
    expect(TAPi18n.getLanguagesCached()).to.equal(snapshot);
    expect(Object.isFrozen(TAPi18n.languages_names.en)).to.equal(false);
  });

  it('requires explicit invalidation after direct metadata writes and retains old snapshots', function () {
    const before = TAPi18n.getLanguagesCached();
    TAPi18n.languages_names.en[1] = 'Custom English';
    TAPi18n.languages_names.fr = ['French', 'Français'];
    expect(TAPi18n.getLanguages().en.name).to.equal('Custom English');
    expect(TAPi18n.getLanguagesCached()).to.equal(before);
    expect(TAPi18n.invalidateLanguagesCache()).to.equal(undefined);
    const after = TAPi18n.getLanguagesCached();
    expect(after).not.to.equal(before);
    expect(after.en.name).to.equal('Custom English');
    expect(after.fr.name).to.equal('Français');
    expect(before.en.name).to.equal('English');
    expect(before.fr).to.equal(undefined);
    delete TAPi18n.languages_names.fr;
    TAPi18n.invalidateLanguagesCache();
    expect(TAPi18n.getLanguagesCached().fr).to.equal(undefined);
    expect(after.fr.name).to.equal('Français');
  });

  it('filters explicit membership, includes fallback, and preserves distinct registered spellings', function () {
    TAPi18n.languages_names['PT-br'] = ['Historical spelling', 'Historical spelling'];
    TAPi18n.conf.supported_languages = ['PT-br', 'pt-BR', 'PT-br'];
    const before = TAPi18n.getLanguagesCached();
    expect(Object.keys(before)).to.deep.equal(['en', 'PT-br', 'pt-BR']);
    TAPi18n.conf.supported_languages.splice(0, 3);
    TAPi18n.invalidateLanguagesCache();
    expect(Object.keys(TAPi18n.getLanguagesCached())).to.deep.equal(['en']);
    expect(Object.keys(before)).to.deep.equal(['en', 'PT-br', 'pt-BR']);
  });

  it('uses own dictionary entries even for identifiers matching Object prototype names', function () {
    TAPi18n.languages_names = JSON.parse('{"en":["English","English"],"__proto__":["Custom","Custom"],"constructor":["Constructor","Constructor"]}');
    const snapshot = TAPi18n.getLanguagesCached();
    expect(Object.keys(snapshot)).to.deep.equal(['en', '__proto__', 'constructor']);
    expect(snapshot.__proto__.name).to.equal('Custom');
    expect(Object.isFrozen(snapshot.__proto__)).to.equal(true);
  });

  it('rejects missing or non-string names without publishing a partial cache or freezing caller data', function () {
    TAPi18n.conf.supported_languages = ['fr'];
    expect(() => TAPi18n.getLanguagesCached()).to.throw(TypeError, 'string language names for fr');
    const custom = {label: 'Français'};
    TAPi18n.languages_names.fr = ['French', custom];
    expect(() => TAPi18n.getLanguagesCached()).to.throw(TypeError, 'string language names for fr');
    expect(Object.isFrozen(custom)).to.equal(false);
    expect(TAPi18n.getLanguages().fr.name).to.equal(custom);
    TAPi18n.languages_names.fr[1] = 'Français';
    expect(TAPi18n.getLanguagesCached().fr).to.deep.equal({name: 'Français', en: 'French'});
  });
});
