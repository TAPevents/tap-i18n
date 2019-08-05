t = Package["tap:i18n"].TAPi18n

Tinytest.add 'Enabled tap-i18n Tests - TAPi18n is defined in global namespace', (test) ->
  test.isTrue typeof TAPi18n != "undefined"

Tinytest.add 'Enabled tap-i18n Tests - TAPi18n._enabled() returns true', (test) ->
  test.isTrue TAPi18n._enabled()

Tinytest.add 'Enabled tap-i18n Tests - fallback language is in TAPi18n.languages_names', (test) ->
  test.isTrue TAPi18n._fallback_language of TAPi18n.languages_names

Tinytest.add 'Enabled tap-i18n Tests - fallback language is in the returned TAPi18n.getLanguages() object', (test) ->
  test.isTrue TAPi18n._fallback_language of TAPi18n.getLanguages()

Tinytest.add 'Enabled tap-i18n Tests - fallback language is in the returned TAPi18n._getProjectLanguages() array', (test) ->
  test.isTrue TAPi18n._fallback_language in TAPi18n._getProjectLanguages()

Tinytest.add 'Enabled tap-i18n Tests - TAPi18next language is set to the fallback_language on init', (test) ->
  test.equal TAPi18next.lng(), t._fallback_language
