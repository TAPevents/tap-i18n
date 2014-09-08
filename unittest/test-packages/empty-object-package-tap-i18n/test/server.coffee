Tinytest.add 'empty-package-tap-i18n - package translations are added to TAPi18n.translations', (test) ->
  for lang_tag in ["bb", "cc-CC", "cc"]
    test.isTrue (lang_tag of Package["tap:i18n"].TAPi18n.translations) and ("tap-tests:empty-object-package-tap-i18n" of Package["tap:i18n"].TAPi18n.translations[lang_tag])