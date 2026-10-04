import {expect} from 'chai';
import {TAPi18n, TAPi18next} from 'meteor/tap:i18n';
import {Tracker} from 'meteor/tracker';
import {$} from 'meteor/jquery';
import {TapI18nTest, asPromise} from '../../helpers';

describe('TAPi18n - language tag reactivity', function () {
  it('tracks warm, unsupported and disabled reads', function () {
    const previous = {conf: TAPi18n.conf, names: TAPi18n.languages_names};
    let computation;
    try {
      TAPi18n.conf = {supported_languages: null};
      TAPi18n.languages_names = {en: ['English', 'English']};
      TAPi18n.invalidateLanguagesCache();
      TAPi18n.getCanonicalLanguageTag('EN');
      let runs = 0, tag;
      computation = Tracker.autorun(() => { runs++; tag = TAPi18n.getCanonicalLanguageTag('FR'); });
      expect(tag).to.equal(undefined);
      TAPi18n.languages_names.fr = ['French', 'Français'];
      TAPi18n.invalidateLanguagesCache();
      Tracker.flush();
      expect(runs).to.equal(2);
      expect(tag).to.equal('fr');
      TAPi18n.conf = null;
      TAPi18n.invalidateLanguagesCache();
      Tracker.flush();
      expect(tag).to.equal(undefined);
      TAPi18n.conf = {supported_languages: null};
      TAPi18n.invalidateLanguagesCache();
      Tracker.flush();
      expect(runs).to.equal(4);
      expect(tag).to.equal('fr');
    } finally {
      if (computation) computation.stop();
      TAPi18n.conf = previous.conf;
      TAPi18n.languages_names = previous.names;
      TAPi18n.invalidateLanguagesCache();
      Tracker.flush();
    }
  });
});

if (TapI18nTest.regularCatalog()) describe('TAPi18n - automatic case resolution', function () {
  afterEach(async function () { await asPromise(TAPi18n.setLanguage('en')); });

  it('selects and loads a case-varied language under its registered key', async function () {
    await asPromise(TAPi18n.setLanguage('CC-cc'));
    expect(TAPi18n.getLanguage()).to.equal('cc-CC');
    expect(TAPi18n.__('message')).to.equal('cc-CC message');
    expect(TAPi18n.__('base_only')).to.equal('cc base');
    expect(TAPi18n._loaded_languages).not.to.include('CC-cc');
  });

  it('keeps fresh exact membership checks outside the cached resolver', async function () {
    const previous = TAPi18n.conf.supported_languages;
    TAPi18n.getCanonicalLanguageTag('cc-CC');
    try {
      TAPi18n.conf.supported_languages = ['en'];
      let rejection;
      try { await asPromise(TAPi18n.setLanguage('cc-CC')); } catch (error) { rejection = error; }
      expect(rejection).to.be.an('error');
      expect(TAPi18n.getLanguage()).to.equal('en');
      TAPi18n.conf.supported_languages = ['en', 'cc-CC', 'cc'];
      await asPromise(TAPi18n.setLanguage('cc-CC'));
      expect(TAPi18n.getLanguage()).to.equal('cc-CC');
    } finally {
      TAPi18n.conf.supported_languages = previous;
      TAPi18n.invalidateLanguagesCache();
    }
  });

  it('shares explicit translation keys across argument and helper-option case variants', async function () {
    await asPromise(TAPi18n._prepareLanguageSpecificTranslator('CC-cc'));
    expect(TAPi18n.__('message', {}, 'CC-cc')).to.equal('cc-CC message');
    expect(TAPi18n.__('message', {lng: 'CC-cc'})).to.equal('cc-CC message');
    expect(TAPi18n.__('message', {lang: 'CC-cc'})).to.equal('cc-CC message');
    expect(TAPi18n.getLanguage()).to.equal('en');
    expect(Object.hasOwnProperty.call(TAPi18n._languageSpecificTranslators, 'CC-cc')).to.equal(false);
  });

  it('resolves a surviving lng override while preserving precedence and exact resource keys', async function () {
    await asPromise(TAPi18n.setLanguage('CC-cc'));
    await asPromise(TAPi18n._prepareLanguageSpecificTranslator('cc-CC'));
    const options = Object.freeze({lng: 'CC'});
    expect(TAPi18n.__('message', options, 'CC-cc')).to.equal('cc message');
    expect(TAPi18n.__('message', {lng: 'cc'}, 'cc-CC')).to.equal('cc message');
    expect(options.lng).to.equal('CC');
    const resources = TAPi18next.options.resStore;
    const previousResource = Object.getOwnPropertyDescriptor(resources, 'CC');
    TAPi18next.addResourceBundle('CC', 'tap-test-exact-option', {message: 'exact resource'});
    try {
      const translate = TAPi18n._getPackageI18nextProxy('tap-test-exact-option');
      expect(translate('message', options, 'cc-CC')).to.equal('exact resource');
    } finally {
      if (previousResource) Object.defineProperty(resources, 'CC', previousResource);
      else delete resources.CC;
    }
  });

  it('loads and reactively updates a case-varied public translation from a cold translator', async function () {
    const tag = 'cc-CC';
    const translator = Object.getOwnPropertyDescriptor(TAPi18n._languageSpecificTranslators, tag);
    const tracker = Object.getOwnPropertyDescriptor(TAPi18n._languageSpecificTranslatorsTrackers, tag);
    const loaded = TAPi18n._loaded_languages;
    const getJSON = $.getJSON;
    const requests = [], values = [];
    let computation;
    try {
      delete TAPi18n._languageSpecificTranslators[tag];
      delete TAPi18n._languageSpecificTranslatorsTrackers[tag];
      TAPi18n._loaded_languages = loaded.filter(language => language !== tag);
      $.getJSON = function (url, ...args) { requests.push(url); return getJSON.call(this, url, ...args); };
      await new Promise((resolve, reject) => {
        computation = Tracker.autorun(() => {
          try {
            const value = TAPi18n.__('message', {}, 'CC-cc');
            values.push(value);
            if (value === 'cc-CC message') resolve();
          } catch (error) { reject(error); }
        });
      });
      expect(values[0]).to.equal('English message');
      expect(values[values.length - 1]).to.equal('cc-CC message');
      expect(requests).to.deep.equal([TAPi18n._getLanguageFilePath(tag)]);
      expect(TAPi18n.getLanguage()).to.equal('en');
      const runs = values.length;
      TAPi18n.invalidateLanguagesCache();
      Tracker.flush();
      expect(values.length).to.equal(runs + 1);
      expect(values[values.length - 1]).to.equal('cc-CC message');
    } finally {
      if (computation) computation.stop();
      $.getJSON = getJSON;
      TAPi18n._loaded_languages = loaded;
      for (const [dictionary, descriptor] of [[TAPi18n._languageSpecificTranslators, translator],
        [TAPi18n._languageSpecificTranslatorsTrackers, tracker]]) {
        if (descriptor) Object.defineProperty(dictionary, tag, descriptor);
        else delete dictionary[tag];
      }
    }
  });

  it('does not subscribe language selection commands to catalog changes', async function () {
    let runs = 0, selection;
    const computation = Tracker.autorun(() => { runs++; selection = TAPi18n.setLanguage('CC-cc'); });
    try {
      await asPromise(selection);
      TAPi18n.invalidateLanguagesCache();
      Tracker.flush();
      expect(runs).to.equal(1);
      expect(TAPi18n.getLanguage()).to.equal('cc-CC');
    } finally { computation.stop(); }
  });

  it('resolves single/multi HTTP requests and emits only registered language keys', async function () {
    const route = TAPi18n.conf.i18n_files_route;
    const single = await asPromise($.getJSON(route + '/CC-cc.json'));
    const multi = await asPromise($.getJSON(route + '/multi/CC,CC-cc,cc-CC,EN.json'));
    expect(single.project.message).to.equal('cc-CC message');
    expect(Object.keys(multi).sort()).to.deep.equal(['cc', 'cc-CC']);
  });
});


if (TapI18nTest.scenario.startsWith('expanded-')) describe('TAPi18n - expanded language tags', function () {
  afterEach(async function () { await asPromise(TAPi18n.setLanguage('en')); });

  it('preloads configured and runtime tags together, or keeps them cold until requested', function () {
    for (const tag of ['hmn', 'hmn-US', 'es', 'es-419']) {
      expect(TAPi18n._loaded_languages.includes(tag), tag).to.equal(TapI18nTest.scenario === 'expanded-preloaded');
    }
    expect(TAPi18n._loaded_languages).not.to.include('ES-419');
  });

  it('selects three-letter and numeric-region tags with base and English fallback', async function () {
    for (const [input, tag, base] of [['HMN', 'hmn', 'hmn'], ['HMN-us', 'hmn-US', 'hmn'], ['ES-419', 'es-419', 'es']]) {
      await asPromise(TAPi18n.setLanguage(input));
      expect(TAPi18n.getLanguage()).to.equal(tag);
      expect(TAPi18n.__('message')).to.equal(tag + ' message');
      expect(TAPi18n.__('base_only')).to.equal(base + ' base');
      expect(TAPi18n.__('fallback_only')).to.equal('English fallback');
      await asPromise(TAPi18n._prepareLanguageSpecificTranslator(input));
      expect(TAPi18n.__('message', {}, input)).to.equal(tag + ' message');
      expect(TAPi18n.__('message', {lng: input}, 'en')).to.equal(tag + ' message');
    }
  });

  it('serves mixed-case extended tags through single and multi HTTP requests', async function () {
    const route = TAPi18n.conf.i18n_files_route;
    for (const [input, tag] of [['HMN', 'hmn'], ['HMN-us', 'hmn-US'], ['ES-419', 'es-419']]) {
      const data = await asPromise($.getJSON(route + '/' + input + '.json?cache=test.json'));
      expect(data.project.message).to.equal(tag + ' message');
    }
    const multi = await asPromise($.getJSON(route + '/multi/HMN,HMN-us,ES-419,es-419,EN.json'));
    expect(Object.keys(multi).sort()).to.deep.equal(['es-419', 'hmn', 'hmn-US']);
    expect(multi['es-419'].project.message).to.equal('es-419 message');
  });

  it('rejects unsupported tag structures and malformed JSON resource paths', async function () {
    const route = TAPi18n.conf.i18n_files_route;
    const status = url => new Promise(resolve => $.getJSON(url)
      .done((_data, _text, xhr) => resolve(xhr.status)).fail(xhr => resolve(xhr.status)));
    for (const suffix of ['zh-Hant.json', 'sl-rozaj.json', 'abcd.json', 'en-USA.json',
      'es-41.json', 'es-419xjson', 'es-419.JSON', 'multi/es-419,zh-Hant.json', 'multi/es-419,.json']) {
      expect(await status(route + '/' + suffix), suffix).to.equal(401);
    }
    expect(await status(route + '/zz-999.json')).to.equal(404);
  });
});
