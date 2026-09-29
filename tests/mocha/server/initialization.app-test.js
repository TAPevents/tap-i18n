import {expect} from 'chai';
import {TAPi18n, TAPi18next} from 'meteor/tap:i18n';

describe('TAPi18n - package resources before project enablement', function () {
  const tag = 'xy';
  const namespaces = ['tap-test-pending-a', 'tap-test-pending-b', 'tap-test-later'];
  let previous;

  beforeEach(function () {
    previous = {
      conf: TAPi18n.conf,
      names: TAPi18n.languages_names,
      translations: TAPi18n.translations[tag],
      translator: TAPi18n.server_translators[tag]
    };
    TAPi18n.conf = null;
    TAPi18n.languages_names = {en: ['English', 'English']};
    TAPi18n.translations[tag] = {
      [namespaces[0]]: {message: 'Pending package A'},
      [namespaces[1]]: {message: 'Pending package B'}
    };
    delete TAPi18n.server_translators[tag];

    // Follow generated-file order: packages load while disabled; an English
    // project file enables translation; a later project file discovers xy.
    TAPi18n._registerServerTranslator(tag, namespaces[0]);
    TAPi18n._registerServerTranslator(tag, namespaces[1]);
    TAPi18n._enable({});
    TAPi18n.languages_names[tag] = [tag, tag];
    TAPi18n.translations[tag][namespaces[2]] = {message: 'Later project file'};
    TAPi18n._registerServerTranslator(tag, namespaces[2]);
  });

  afterEach(function () {
    TAPi18n.conf = previous.conf;
    TAPi18n.languages_names = previous.names;
    TAPi18n.invalidateLanguagesCache();
    if (previous.translations === undefined) delete TAPi18n.translations[tag];
    else TAPi18n.translations[tag] = previous.translations;
    if (previous.translator === undefined) delete TAPi18n.server_translators[tag];
    else TAPi18n.server_translators[tag] = previous.translator;
    namespaces.forEach(namespace => TAPi18next.removeResourceBundle(tag, namespace));
  });

  function translate(namespace) {
    return TAPi18n._getPackageI18nextProxy(namespace)('message', {}, tag);
  }

  it('makes every pending namespace available when the language is discovered', function () {
    expect(translate(namespaces[0])).to.equal('Pending package A');
    expect(translate(namespaces[1])).to.equal('Pending package B');
    expect(translate(namespaces[2])).to.equal('Later project file');
  });

  it('applies later files without losing other namespaces', function () {
    TAPi18n.translations[tag][namespaces[0]].message = 'Updated package A';
    TAPi18n._registerServerTranslator(tag, namespaces[0]);
    expect(translate(namespaces[0])).to.equal('Updated package A');
    expect(translate(namespaces[1])).to.equal('Pending package B');
    expect(translate(namespaces[2])).to.equal('Later project file');
  });
});
