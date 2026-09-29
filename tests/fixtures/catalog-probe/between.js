catalogProbe.afterConfiguration = TAPi18n.getLanguagesCached();
TAPi18n._onceEnabled = catalogProbe.originalOnceEnabled;
delete catalogProbe.originalOnceEnabled;
