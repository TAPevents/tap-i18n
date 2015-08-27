import {expect} from 'chai';
import {TAPi18n, TAPi18next} from 'meteor/tap:i18n';
import {TapI18nTest} from '../../helpers';

describe('TAPi18n - catalog and registration', function () {
  it('initialization and configuration', function () {
    expect(TAPi18n._enabled()).to.deep.equal(TapI18nTest.enabled());
    expect(TAPi18n._fallback_language).to.deep.equal('en');
    if (!TapI18nTest.enabled()) {
      expect(TAPi18n.conf).to.deep.equal(null);
      expect(TAPi18n.getLanguages()).to.deep.equal(null);
      expect(TAPi18n._getProjectLanguages()).to.deep.equal(['en']);
      expect(TAPi18n.languages_names).to.deep.equal({});
    } else {
      expect(TAPi18n.languages_names.en).to.deep.equal(['English', 'English']);
      expect(TAPi18n.conf.helper_name).to.deep.equal(TapI18nTest.scenario === 'configured' ? 'tr_project' : '_');
      expect(TAPi18n.conf.i18n_files_route).to.deep.equal(TapI18nTest.scenario === 'configured' ? '/fixture-translations' : '/tap-i18n');
    }
  });

  it('programmatic translation tags retain their spelling', function () {
    var tag = 'PT-br';
    var namespace = 'tap-test-raw';
    var previous = TAPi18n._loadTranslations_cache[tag];
    try {
      TAPi18n.loadTranslations({'PT-br': {raw_key: 'raw value'}}, namespace);
      expect(TAPi18n._loadTranslations_cache[tag][namespace].raw_key).to.deep.equal('raw value');
      expect(Object.prototype.hasOwnProperty.call(TAPi18n._loadTranslations_cache, 'pt-BR')).to.equal(false);
      expect(Object.prototype.hasOwnProperty.call(TAPi18n.languages_names, tag)).to.equal(false);
    } finally {
      if (previous === undefined) delete TAPi18n._loadTranslations_cache[tag];
      else TAPi18n._loadTranslations_cache[tag] = previous;
      TAPi18next.removeResourceBundle(tag, namespace);
    }
  });

  it('runtime translations override subsequently loaded files', function () {
    var namespace = 'tap-test-priority';
    var previous = TAPi18n._loadTranslations_cache.en;
    try {
      TAPi18n.loadTranslations({en: {message: 'runtime'}}, namespace);
      var data = {};
      data[namespace] = {message: 'file', file_only: 'from file'};
      TAPi18n._loadLangFileObject('en', data);
      expect(TAPi18next.t(namespace + ':message', {lng: 'en'})).to.deep.equal('runtime');
      expect(TAPi18next.t(namespace + ':file_only', {lng: 'en'})).to.deep.equal('from file');
    } finally {
      if (previous === undefined) delete TAPi18n._loadTranslations_cache.en;
      else delete TAPi18n._loadTranslations_cache.en[namespace];
      TAPi18next.removeResourceBundle('en', namespace);
    }
  });

  if (TapI18nTest.scenario === 'raw-config') {
    // Characterize the existing inconsistency, rather than silently fixing it.
    it('compiler preserves noncanonical configured tags', function () {
      expect(TAPi18n.conf.supported_languages).to.deep.equal(['CC-cc']);
      expect(TAPi18n._getProjectLanguages()).to.deep.equal(['en', 'CC-cc']);
      expect(Object.prototype.hasOwnProperty.call(TAPi18n.languages_names, 'cc-CC')).to.equal(true);
      expect(Object.prototype.hasOwnProperty.call(TAPi18n.languages_names, 'CC-cc')).to.equal(false);
      expect(function () { TAPi18n.getLanguages(); }).to.throw();
      expect(function () { TAPi18n.getLanguagesCached(); }).to.throw(TypeError);
    });
  }

  if (TapI18nTest.regularCatalog()) {
    it('compiler catalog includes fallback and filters supported languages', function () {
      var languages = TAPi18n.getLanguages();
      expect(TAPi18n.getLanguagesCached()).to.deep.equal(languages);
      expect(Object.keys(languages).sort()).to.deep.equal(TapI18nTest.languages());
      expect(languages.en).to.deep.equal({name: 'English', en: 'English'});
      expect(languages['cc-CC']).to.deep.equal({name: 'cc-CC', en: 'cc-CC'});
      expect(Object.prototype.hasOwnProperty.call(languages, 'zz')).to.equal(false);
      if (TapI18nTest.scenario === 'configured') {
        expect(TAPi18n.conf.supported_languages).to.deep.equal(['cc-CC', 'cc', 'fr', 'cc']);
        expect(languages.fr).to.deep.equal({name: 'Français', en: 'French'});
        expect(Object.prototype.hasOwnProperty.call(languages, 'bb')).to.equal(false);
      }
    });

    it('getLanguages returns independent mutable records', function () {
      var first = TAPi18n.getLanguages();
      var second = TAPi18n.getLanguages();
      expect(first === second).to.equal(false);
      expect(first.en === second.en).to.equal(false);
      first.en.name = 'caller name';
      first.en._id = 'en';
      delete first['cc-CC'];
      first.extra = {name: 'extra', en: 'extra'};
      expect(TAPi18n.getLanguages()).to.deep.equal(second);
      expect(TAPi18n.languages_names.en).to.deep.equal(['English', 'English']);
    });

    it('direct metadata and membership updates are visible on the next read', function () {
      var previousNames = TAPi18n.languages_names['cc-CC'];
      var previousSupported = TAPi18n.conf.supported_languages;
      var oldResult = TAPi18n.getLanguages();
      try {
        TAPi18n.languages_names['cc-CC'] = ['Custom English name', '自訂名稱'];
        expect(TAPi18n.getLanguages()['cc-CC']).to.deep.equal({name: '自訂名稱', en: 'Custom English name'});
        expect(oldResult['cc-CC']).to.deep.equal({name: 'cc-CC', en: 'cc-CC'});
        TAPi18n.conf.supported_languages = ['cc-CC'];
        expect(Object.keys(TAPi18n.getLanguages()).sort()).to.deep.equal(['cc-CC', 'en']);
      } finally {
        TAPi18n.languages_names['cc-CC'] = previousNames;
        TAPi18n.conf.supported_languages = previousSupported;
      }
    });
  }
});
