import {expect} from 'chai';
import {TAPi18n, TAPi18next} from 'meteor/tap:i18n';
import {Tracker} from 'meteor/tracker';
import {Blaze} from 'meteor/blaze';
import {Template} from 'meteor/templating';
import {$} from 'meteor/jquery';
import {TapI18nTest, asPromise} from '../../helpers';

describe('TAPi18n - client selection and loading', function () {
  this.timeout(10000);

  it('starts with the fallback selected and honors wildcard preloading', function () {
    expect(TAPi18n.getLanguage()).to.equal(TapI18nTest.enabled() ? 'en' : null);
    if (TapI18nTest.scenario === 'preloaded') {
      expect(TAPi18n._loaded_languages).to.include('cc-CC').and.include('cc');
      expect(TAPi18n.__('message', {}, 'cc-CC')).to.equal('cc-CC message');
    }
  });

  it('rejects disabled or unsupported selection without changing the selected language', async function () {
    const previous = TAPi18n.getLanguage();
    let rejection;
    try { await asPromise(TAPi18n.setLanguage('xy')); } catch (error) { rejection = error; }
    expect(rejection).to.be.an('error');
    expect(rejection.message).to.include(TapI18nTest.enabled() ? 'not supported' : 'not enabled');
    expect(TAPi18n.getLanguage()).to.equal(previous);
  });

  if (TapI18nTest.regularCatalog()) {
    afterEach(async function () { await asPromise(TAPi18n.setLanguage('en')); });

    if (TapI18nTest.scenario === 'inferred') it('renders the README plural example with both interpolation arguments', function () {
      expect(Blaze.toHTML(Template.messages_today).trim()).to.equal(
        '<p>Hey, Daniel! You have received 18 new messages today.</p>');
    });

    it('reacts to selection and translation changes while getLanguages stays nonreactive', async function () {
      await asPromise(TAPi18n.setLanguage('en'));
      let languageRuns = 0, translationRuns = 0, catalogRuns = 0;
      let language, translation;
      const computations = [
        Tracker.autorun(() => { languageRuns++; language = TAPi18n.getLanguage(); }),
        Tracker.autorun(() => { translationRuns++; translation = TAPi18n.__('message'); }),
        Tracker.autorun(() => { catalogRuns++; TAPi18n.getLanguages(); })
      ];
      try {
        await asPromise(TAPi18n.setLanguage('cc-CC'));
        Tracker.flush();
        expect(language).to.equal('cc-CC');
        expect(translation).to.equal('cc-CC message');
        expect(languageRuns).to.equal(2);
        expect(translationRuns).to.equal(2);
        expect(catalogRuns).to.equal(1);
        expect(TAPi18n.__('base_only')).to.equal('cc base');
        expect(TAPi18n.__('fallback_only')).to.equal('English fallback');
        expect(TAPi18n._loaded_languages).to.include('cc');
        expect(TAPi18n.__('greeting', {name: 'Ada'})).to.equal('Hello Ada!');
      } finally {
        computations.forEach(computation => computation.stop());
      }
    });

    it('invalidates translations on resource updates without invalidating the catalog or selection', function () {
      const namespace = 'tap-test-reactivity';
      const tag = TAPi18n.getLanguage();
      const translate = TAPi18n._getPackageI18nextProxy(namespace);
      let translationRuns = 0, catalogRuns = 0, languageRuns = 0, value;
      const computations = [
        Tracker.autorun(() => { translationRuns++; value = translate('message'); }),
        Tracker.autorun(() => { catalogRuns++; TAPi18n.getLanguages(); }),
        Tracker.autorun(() => { languageRuns++; TAPi18n.getLanguage(); })
      ];
      try {
        TAPi18n.loadTranslations({[tag]: {message: 'updated'}}, namespace);
        Tracker.flush();
        expect(value).to.equal('updated');
        expect(translationRuns).to.equal(2);
        expect(catalogRuns).to.equal(1);
        expect(languageRuns).to.equal(1);
        const previous = TAPi18n.languages_names.en;
        try {
          TAPi18n.languages_names.en = ['Changed', 'Changed'];
          Tracker.flush();
          expect(catalogRuns).to.equal(1);
          expect(TAPi18n.getLanguages().en.name).to.equal('Changed');
        } finally {
          TAPi18n.languages_names.en = previous;
        }
      } finally {
        computations.forEach(computation => computation.stop());
        if (TAPi18n._loadTranslations_cache[tag]) delete TAPi18n._loadTranslations_cache[tag][namespace];
        TAPi18next.removeResourceBundle(tag, namespace);
      }
    });

    it('loads an explicit language translator without changing the selected language', async function () {
      const previous = TAPi18n.getLanguage();
      await asPromise(TAPi18n._prepareLanguageSpecificTranslator('cc'));
      expect(TAPi18n.__('message', {}, 'cc')).to.equal('cc message');
      expect(TAPi18n.getLanguage()).to.equal(previous);
    });

    it('formats shorthand arguments in an explicit language without changing selection', async function () {
      const previous = TAPi18n.getLanguage();
      await asPromise(TAPi18n._prepareLanguageSpecificTranslator('cc-CC'));
      expect(TAPi18n.__('sprintf_greeting', 'Ada', 'cc-CC')).to.equal('cc-CC hello Ada!');
      expect(TAPi18n.__('sprintf_number', 0, 'cc-CC')).to.equal('cc-CC number 0');
      expect(TAPi18n.getLanguage()).to.equal(previous);
    });

    if (TapI18nTest.scenario === 'package') it('registers the compiled package template helper in its own namespace', function () {
      expect(Blaze.toHTML(Template.tapI18nFixture).trim()).to.equal('English package');
      expect(TAPi18n.__('yaml_only')).to.equal('English YAML');
    });

    it('serves compiled resources through the single and multi language HTTP routes', async function () {
      const route = TAPi18n.conf.i18n_files_route;
      const requests = [
        $.getJSON(route + '/cc-CC.json?cache=1'),
        $.getJSON(route + '/multi/cc,cc-CC,en.json?cache=1'),
        $.getJSON(route + '/multi/all.json')
      ];
      const [single, multi, all] = await Promise.all(requests.map(asPromise));
      for (const xhr of requests) {
        expect(xhr.status).to.equal(200);
        expect(xhr.getResponseHeader('Content-Type')).to.equal('application/json; charset=utf-8');
        expect(xhr.getResponseHeader('Access-Control-Allow-Origin')).to.equal('*');
      }
      expect(single.project.message).to.equal('cc-CC message');
      expect(Object.keys(multi).sort()).to.deep.equal(['cc', 'cc-CC']);
      expect(multi.cc.project.base_only).to.equal('cc base');
      if (TapI18nTest.scenario === 'package') expect(all.cc['tap-fixture'].package_message).to.equal('cc package');
      // The existing all endpoint includes translations outside supported_languages.
      expect(all.bb.project.message).to.equal('bb message');
    });

    for (const [tag, status] of [['en', 404], ['xy', 404], ['invalid_tag', 401]]) {
      it('rejects HTTP requests for ' + tag + ' with status ' + status, async function () {
        const xhr = $.ajax({url: TAPi18n.conf.i18n_files_route + '/' + tag + '.json'});
        let rejected = false;
        try { await asPromise(xhr); } catch { rejected = true; }
        expect(rejected).to.equal(true);
        expect(xhr.status).to.equal(status);
      });
    }

    if (TapI18nTest.scenario === 'configured') {
      it('serves empty single and multi language responses as JSON', async function () {
        for (const suffix of ['/fr.json', '/multi/en.json']) {
          const xhr = $.getJSON(TAPi18n.conf.i18n_files_route + suffix);
          expect(await asPromise(xhr)).to.deep.equal({});
          expect(xhr.status).to.equal(200);
          expect(xhr.getResponseHeader('Content-Type')).to.equal('application/json; charset=utf-8');
          expect(xhr.getResponseHeader('Access-Control-Allow-Origin')).to.equal('*');
        }
      });

      it('loads a configured language that has no translation file', async function () {
        await asPromise(TAPi18n.setLanguage('fr'));
        expect(TAPi18n.getLanguage()).to.equal('fr');
        expect(TAPi18n.__('message')).to.equal('English message');
      });
    }
  }
});
