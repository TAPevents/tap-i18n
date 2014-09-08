t = Package["tap:i18n"].TAPi18n

Tinytest.add 'Disabled tap-i18n Tests - TAPi18n.getLanguage() returns null', (test) ->
  test.isNull t.getLanguage()

Tinytest.add 'Disabled tap-i18n Tests - TAPi18n.translations is empty', (test) ->
  test.isTrue _.isEmpty t.translations