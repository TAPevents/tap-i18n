catalogProbe.thirdNames = TAPi18n.languages_names.fr;
catalogProbe.afterSame = TAPi18n.getLanguagesCached();
if (Meteor.isClient) {
  Tracker.flush();
  catalogProbe.invalidationsBeforeStop = catalogProbe.reactiveInvalidations;
  catalogProbe.computation.stop();
  delete catalogProbe.computation;
}
