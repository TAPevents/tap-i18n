catalogProbe.secondNames = TAPi18n.languages_names.fr;
catalogProbe.afterRepeat = TAPi18n.getLanguagesCached();
if (Meteor.isClient) Tracker.flush();
