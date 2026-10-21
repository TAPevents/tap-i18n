import {TAPi18n} from 'meteor/tap:i18n';
const before = TAPi18n.getLanguagesCached();
require('./imports/first.fr.i18n.json');
const firstNames = TAPi18n.languages_names.fr;
const afterFirst = TAPi18n.getLanguagesCached();
firstNames[1] = 'Override between imported modules';
TAPi18n.invalidateLanguagesCache();
const overridden = TAPi18n.getLanguagesCached();
require('./imports/second.fr.i18n.yml');
export const moduleProbe = {
  before, firstNames, afterFirst, overridden,
  secondNames: TAPi18n.languages_names.fr,
  afterSecond: TAPi18n.getLanguagesCached()
};
