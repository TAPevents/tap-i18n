import {expect} from 'chai';
import {Meteor} from 'meteor/meteor';
import {Tracker} from 'meteor/tracker';
import {TAPi18n} from 'meteor/tap:i18n';

describe('TAPi18n - canonical language tags', function () {
  let previous;
  beforeEach(function () {
    previous = {conf: TAPi18n.conf, names: TAPi18n.languages_names,
      getter: Object.getOwnPropertyDescriptor(TAPi18n, '_getProjectLanguages')};
    TAPi18n.conf = {supported_languages: null};
    TAPi18n.languages_names = {en: ['English', 'English'],
      'pt-BR': ['Portuguese', 'Português'], he: ['Hebrew', 'עברית']};
    TAPi18n.invalidateLanguagesCache();
  });
  afterEach(function () {
    if (previous.getter) Object.defineProperty(TAPi18n, '_getProjectLanguages', previous.getter);
    else delete TAPi18n._getProjectLanguages;
    TAPi18n.conf = previous.conf;
    TAPi18n.languages_names = previous.names;
    TAPi18n.invalidateLanguagesCache();
  });

  it('returns a registered string without selecting, rewriting, alias conversion or fallback', function () {
    const before = JSON.stringify(TAPi18n.languages_names);
    expect(TAPi18n.getCanonicalLanguageTag('PT-br')).to.equal('pt-BR');
    expect(TAPi18n.getCanonicalLanguageTag('eN')).to.equal('en');
    for (const input of ['', 'fr', 'iw', 'pt_BR', ' pt-BR ', '__proto__', 'constructor']) {
      expect(TAPi18n.getCanonicalLanguageTag(input)).to.equal(undefined);
    }
    expect(JSON.stringify(TAPi18n.languages_names)).to.equal(before);
  });

  it('rejects non-string input before enumerating the catalog', function () {
    TAPi18n._getProjectLanguages = () => { throw new Error('Unexpected catalog read'); };
    for (const input of [undefined, null, 42, false, {}, []]) {
      expect(TAPi18n.getCanonicalLanguageTag(input)).to.equal(undefined);
    }
  });

  it('preserves exact case-distinct tags and uses first registration for ambiguous inputs', function () {
    TAPi18n.conf.supported_languages = ['PT-br', 'pt-BR'];
    expect(TAPi18n.getCanonicalLanguageTag('PT-br')).to.equal('PT-br');
    expect(TAPi18n.getCanonicalLanguageTag('pt-BR')).to.equal('pt-BR');
    expect(TAPi18n.getCanonicalLanguageTag('pt-br')).to.equal('PT-br');
    expect(TAPi18n.conf.supported_languages).to.deep.equal(['PT-br', 'pt-BR']);
  });

  it('enumerates once for repeated hits and misses, then rebuilds only after invalidation', function () {
    const original = TAPi18n._getProjectLanguages;
    let enumerations = 0;
    TAPi18n._getProjectLanguages = function () { enumerations++; return original.call(this); };
    for (let i = 0; i < 100; i++) {
      expect(TAPi18n.getCanonicalLanguageTag('PT-br')).to.equal('pt-BR');
      expect(TAPi18n.getCanonicalLanguageTag('pt-BR')).to.equal('pt-BR');
      expect(TAPi18n.getCanonicalLanguageTag('FR')).to.equal(undefined);
    }
    expect(enumerations).to.equal(1);
    TAPi18n.languages_names.fr = ['French', 'Français'];
    expect(TAPi18n.getCanonicalLanguageTag('FR')).to.equal(undefined);
    TAPi18n.invalidateLanguagesCache();
    expect(TAPi18n.getCanonicalLanguageTag('FR')).to.equal('fr');
    expect(enumerations).to.equal(2);
  });

  it('resolves supported tags without requiring display metadata', function () {
    TAPi18n.conf.supported_languages = ['CC-cc'];
    expect(TAPi18n.getCanonicalLanguageTag('cc-CC')).to.equal('CC-cc');
    expect(() => TAPi18n.getLanguagesCached()).to.throw(TypeError);
  });

  it('handles disabled, enabled and removed catalogs', function () {
    TAPi18n.conf = null;
    expect(TAPi18n.getCanonicalLanguageTag('EN')).to.equal(undefined);
    TAPi18n.conf = {supported_languages: null};
    TAPi18n.invalidateLanguagesCache();
    expect(TAPi18n.getCanonicalLanguageTag('PT-br')).to.equal('pt-BR');
    TAPi18n.conf.supported_languages = [];
    TAPi18n.invalidateLanguagesCache();
    expect(TAPi18n.getCanonicalLanguageTag('PT-br')).to.equal(undefined);
    expect(TAPi18n.getCanonicalLanguageTag('EN')).to.equal('en');
  });

  if (Meteor.isServer) it('does not subscribe server computations to catalog invalidation', function () {
    let runs = 0;
    const computation = Tracker.autorun(() => { runs++; TAPi18n.getCanonicalLanguageTag('EN'); });
    try {
      TAPi18n.invalidateLanguagesCache();
      Tracker.flush();
      expect(runs).to.equal(1);
    } finally { computation.stop(); }
  });
});


describe('TAPi18n - shared statics', function () {
  it('exposes immutable primitive properties in enabled and disabled projects', function () {
    const expected = {fallback_language: 'en', project_translations_domain: 'project',
      default_i18n_files_route: '/tap-i18n', language_tag_pattern: TAPi18n.language_tag_pattern};
    for (const [name, value] of Object.entries(expected)) {
      expect(value).to.be.a('string');
      expect(Object.getOwnPropertyDescriptor(TAPi18n, name)).to.deep.equal({
        value, enumerable: true, writable: false, configurable: false
      });
      expect(Reflect.set(TAPi18n, name, 'changed')).to.equal(false);
      expect(Reflect.deleteProperty(TAPi18n, name)).to.equal(false);
      expect(TAPi18n[name]).to.equal(value);
    }
    const filenames = new RegExp('^(?:' + TAPi18n.language_tag_pattern + ')$');
    const runtime = new RegExp('^(?:' + TAPi18n.language_tag_pattern + ')$', 'i');
    for (const tag of ['en', 'pt-BR', 'hmn', 'hmn-US', 'es-419', 'hmn-419']) {
      expect(filenames.test(tag), tag).to.equal(true);
      expect(runtime.test(tag.toUpperCase()), tag).to.equal(true);
    }
    expect(filenames.test('HMN-us')).to.equal(false);
    for (const tag of ['e', 'abcd', 'es-41', 'es-4199', 'en-USA', 'zh-Hant', 'zh-Hant-TW', 'sl-rozaj', 'es_419']) {
      expect(runtime.test(tag), tag).to.equal(false);
    }
  });
});
