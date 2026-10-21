catalogProbe.firstNames = TAPi18n.languages_names.fr;
catalogProbe.firstNames[1] = 'Application override between files';
TAPi18n.invalidateLanguagesCache();
catalogProbe.overridden = TAPi18n.getLanguagesCached();
catalogProbe.reactiveReads = [];
catalogProbe.reactiveInvalidations = 0;
if (Meteor.isClient) {
  catalogProbe.computation = Tracker.autorun(function (computation) {
    catalogProbe.reactiveReads.push(TAPi18n.getLanguagesCached());
    TAPi18n.getCanonicalLanguageTag('FR');
    computation.onInvalidate(function () { catalogProbe.reactiveInvalidations++; });
  });
}
