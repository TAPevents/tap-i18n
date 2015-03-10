import {expect} from 'chai';
import {TAPi18next} from 'meteor/tap:i18n';

describe('TAPi18n - plural rule replacement', function () {
  const namespace = 'tap-test-plural-rules';
  const plurals = TAPi18next.pluralExtensions;
  const replacement = {name: 'Test rule', numbers: [1], plurals: function () { return 0; }};
  let previousLanguage, previousRules;
  const translate = () => TAPi18next.t(namespace + ':items', {count: 2});

  beforeEach(function () {
    previousLanguage = TAPi18next.lng();
    previousRules = {en: plurals.rules.en, nl: plurals.rules.nl, 'en-US': plurals.rules['en-US']};
    TAPi18next.addResourceBundle('en', namespace, {
      items: 'One item', items_plural: 'Original rule', items_plural_1: 'Updated rule'
    });
    TAPi18next.addResourceBundle('en-US', namespace, {});
  });

  afterEach(function () {
    for (const language of Object.keys(previousRules)) {
      if (previousRules[language] === undefined) delete plurals.rules[language];
      else plurals.rules[language] = previousRules[language];
    }
    plurals.currentRule = null;
    TAPi18next.setLng(previousLanguage);
    for (const language of ['en', 'en-US']) TAPi18next.removeResourceBundle(language, namespace);
  });

  for (const language of ['en', 'en-US']) {
    it('uses a replaced base rule immediately while ' + language + ' is active', function () {
      TAPi18next.setLng(language);
      expect(translate()).to.equal('Original rule');
      plurals.addRule('en', replacement);
      expect(translate()).to.equal('Updated rule');
      expect(plurals.currentRule.lng).to.equal(language);
      expect(plurals.get('en-GB', 2)).to.equal(plurals.get(language, 2));
    });
  }

  it('leaves the active cache alone when an unrelated rule changes', function () {
    TAPi18next.setLng('en-US');
    const cached = plurals.currentRule;
    const activeRule = cached.rule;
    plurals.addRule('nl', replacement);
    expect(plurals.currentRule).to.equal(cached);
    expect(plurals.currentRule.rule).to.equal(activeRule);
    expect(translate()).to.equal('Original rule');
  });

  it('uses an updated inactive base rule on lookup and later selection', function () {
    TAPi18next.setLng('nl');
    const cached = plurals.currentRule;
    plurals.addRule('en', replacement);
    expect(plurals.currentRule).to.equal(cached);
    expect(plurals.get('en-US', 2)).to.equal(1);
    TAPi18next.setLng('en-US');
    expect(translate()).to.equal('Updated rule');
  });

  it('preserves base-language lookup when a regional rule is registered', function () {
    TAPi18next.setLng('en-US');
    const activeRule = plurals.currentRule.rule;
    plurals.addRule('en-US', replacement);
    expect(plurals.currentRule.rule).to.equal(activeRule);
    expect(translate()).to.equal('Original rule');
    TAPi18next.setLng('en');
    TAPi18next.setLng('en-US');
    expect(translate()).to.equal('Original rule');
  });

  it('accepts a rule before the active cache is initialized', function () {
    plurals.currentRule = null;
    plurals.addRule('en', replacement);
    plurals.setCurrentLng('en-US');
    expect(plurals.get('en-US', 2)).to.equal(1);
  });
});
