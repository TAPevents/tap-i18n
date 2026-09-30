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
