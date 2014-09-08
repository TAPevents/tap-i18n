t = Package["tap:i18n"].TAPi18n

Tinytest.add 'Disabled tap-i18n Tests - fallback language is not in TAPi18n.translations', (test) ->
  test.isTrue not(t._fallback_language of t.translations)