import {expect} from 'chai';
import {TAPi18n, TAPi18next} from 'meteor/tap:i18n';
import {TapI18nTest} from '../../helpers';

describe('TAPi18n - server translation', function () {
  if (TapI18nTest.regularCatalog()) {
    it('compiled JSON YAML interpolation and language fallback', function () {
      expect(TAPi18n.__('message')).to.deep.equal('English message');
      expect(TAPi18n.__('yaml_only')).to.deep.equal('English YAML');
      expect(TAPi18n.__('greeting', {name: 'Ada'})).to.deep.equal('Hello Ada!');
      expect(TAPi18n.__('message', {}, 'cc-CC')).to.deep.equal('cc-CC message');
      expect(TAPi18n.__('base_only', {}, 'cc-CC')).to.deep.equal('cc base');
      expect(TAPi18n.__('fallback_only', {}, 'cc-CC')).to.deep.equal('English fallback');
    });

    it('resolves explicit case variants and preserves unsupported-language fallback', function () {
      expect(TAPi18n.__('message', {}, 'CC-cc')).to.equal('cc-CC message');
      expect(TAPi18n.__('sprintf_greeting', 'Ada', 'CC-cc')).to.equal('cc-CC hello Ada!');
      expect(TAPi18n.__('message', {}, 'xy')).to.equal('English message');
      expect(TAPi18n.__('message', {}, 'bb')).to.equal(
        TapI18nTest.scenario === 'configured' ? 'English message' : 'bb message');
    });

    it('resolves lng options without changing precedence or mutating caller options', function () {
      const options = Object.freeze({lng: 'CC'});
      expect(TAPi18n.__('message', options)).to.equal('cc message');
      expect(TAPi18n.__('message', options, 'CC-cc')).to.equal('cc message');
      expect(TAPi18n.__('message', {lng: 'cc'}, 'cc-CC')).to.equal('cc message');
      expect(options.lng).to.equal('CC');
      // Exact resource keys can exist without project support or a fixed translator.
      const resources = TAPi18next.options.resStore;
      const previousResource = Object.getOwnPropertyDescriptor(resources, 'CC');
      TAPi18next.addResourceBundle('CC', 'tap-test-exact-option', {message: 'exact resource'});
      try {
        const translate = TAPi18n._getPackageI18nextProxy('tap-test-exact-option');
        expect(translate('message', options)).to.equal('exact resource');
      } finally {
        if (previousResource) Object.defineProperty(resources, 'CC', previousResource);
        else delete resources.CC;
      }
    });

    it('formats shorthand arguments in the requested language and its fallback', function () {
      expect(TAPi18n.__('sprintf_greeting', 'Ada', 'cc-CC')).to.equal('cc-CC hello Ada!');
      expect(TAPi18n.__('sprintf_number', 0, 'cc-CC')).to.equal('cc-CC number 0');
      expect(TAPi18n.__('sprintf_fallback', 'Ada', 'cc-CC')).to.equal('Fallback Ada');
      expect(TAPi18n.__('sprintf_greeting', 'Ada')).to.equal('Hello Ada!');
    });

    if (TapI18nTest.scenario === 'package') it('compiled package namespace is isolated from the project', function () {
      var translate = Package['tap-i18n-tests:namespaced'].translateFixture;
      expect(translate('package_message')).to.deep.equal('English package');
      expect(translate('package_message', {}, 'cc-CC')).to.deep.equal('cc package');
      expect(TAPi18n.__('package_message')).to.deep.equal('package_message');
    });
  }
});


if (TapI18nTest.scenario.startsWith('expanded-')) describe('TAPi18n - expanded server language tags', function () {
  it('translates registered three-letter and numeric-region tags with case resolution and fallback', function () {
    for (const [input, tag, base] of [['HMN', 'hmn', 'hmn'], ['HMN-us', 'hmn-US', 'hmn'], ['ES-419', 'es-419', 'es']]) {
      expect(TAPi18n.getCanonicalLanguageTag(input)).to.equal(tag);
      expect(TAPi18n.__('message', {}, input)).to.equal(tag + ' message');
      expect(TAPi18n.__('message', {lng: input})).to.equal(tag + ' message');
      expect(TAPi18n.__('base_only', {}, input)).to.equal(base + ' base');
      expect(TAPi18n.__('fallback_only', {}, input)).to.equal('English fallback');
    }
  });
});
