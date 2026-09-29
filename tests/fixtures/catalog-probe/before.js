catalogProbe = {disabled: TAPi18n.getLanguagesCached()};
TAPi18n.languages_names.en = ['Before configuration', 'Before configuration'];
catalogProbe.originalOnceEnabled = TAPi18n._onceEnabled;
TAPi18n._onceEnabled = function () {
  catalogProbe.originalOnceEnabled.call(this);
  catalogProbe.duringEnable = this.getLanguagesCached();
};
