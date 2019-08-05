Tinytest.add 'Enabled tap-i18n Tests - TAPi18n.getLanguages() returns the fallback language if no language was set', (test) ->
  test.equal TAPi18n.getLanguage(), TAPi18n._fallback_language