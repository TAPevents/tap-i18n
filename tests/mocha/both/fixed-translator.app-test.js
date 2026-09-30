import {expect} from 'chai';
import {TAPi18n, TAPi18next} from 'meteor/tap:i18n';

describe('TAPi18n - fixed-language arguments', function () {
  const namespace = 'tap-test-fixed-arguments';
  let previousLanguage, previousShortcut;
  const key = name => namespace + ':' + name;
  const fixed = () => TAPi18n._getSpecificLangTranslator('nl');

  beforeEach(function () {
    previousLanguage = TAPi18next.lng();
    previousShortcut = TAPi18next.options.shortcutFunction;
    TAPi18next.options.shortcutFunction = 'sprintf';
    TAPi18next.addResourceBundle('en', namespace, {
      greeting: 'Hello %s!', pair: '%s has %d messages', number: 'Number %d',
      named: 'Hello __name__!', label: 'English', fallback: 'Fallback %s'
    });
    TAPi18next.addResourceBundle('nl', namespace, {
      greeting: 'Hallo %s!', pair: '%s heeft %d berichten', number: 'Getal %d',
      named: 'Hallo __name__!', label: 'Nederlands'
    });
  });

  afterEach(function () {
    TAPi18next.options.shortcutFunction = previousShortcut;
    TAPi18next.setLng(previousLanguage);
    for (const language of ['en', 'nl']) TAPi18next.removeResourceBundle(language, namespace);
  });

  it('formats a shorthand string in the fixed language', function () {
    expect(fixed()(key('greeting'), 'Ada')).to.equal('Hallo Ada!');
    expect(TAPi18next.lng()).to.equal(previousLanguage);
  });

  it('accepts numeric shorthand, including zero', function () {
    expect(fixed()(key('number'), 0)).to.equal('Getal 0');
    expect(fixed()(key('number'), 18)).to.equal('Getal 18');
  });

  it('keeps all formatting arguments in a fixed engine translator', function () {
    expect(fixed()(key('pair'), 'Ada', 18)).to.equal('Ada heeft 18 berichten');
  });

  it('formats a fallback translation when the fixed language has no key', function () {
    expect(fixed()(key('fallback'), 'Ada')).to.equal('Fallback Ada');
  });

  it('honors the configured default-value shortcut mode', function () {
    TAPi18next.options.shortcutFunction = 'defaultValue';
    expect(fixed()(key('missing'), 'Default text')).to.equal('Default text');
    expect(fixed()(key('label'), 'Default text')).to.equal('Nederlands');
    expect(TAPi18next.t(key('missing'), 'Default text')).to.equal('Default text');
  });

  it('keeps omitted and null options working', function () {
    expect(fixed()(key('label'))).to.equal('Nederlands');
    expect(fixed()(key('label'), null)).to.equal('Nederlands');
  });

  it('does not add language fields to a caller options object', function () {
    const options = Object.freeze({name: 'Ada'});
    const translate = fixed();
    expect(translate(key('named'), options)).to.equal('Hallo Ada!');
    expect(translate(key('named'), options)).to.equal('Hallo Ada!');
    expect(options).to.deep.equal({name: 'Ada'});
  });

  it('preserves an explicit options language override', function () {
    const options = {name: 'Ada', lng: 'en'};
    expect(fixed()(key('named'), options)).to.equal('Hello Ada!');
    expect(options).to.deep.equal({name: 'Ada', lng: 'en'});
  });
});
