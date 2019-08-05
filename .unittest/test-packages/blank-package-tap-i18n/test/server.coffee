Tinytest.add 'blank-package-tap-i18n - basic template that had been registered with registerTemplate rendered correctly', (test) ->
  for lang_tag in ["bb", "cc-CC", "cc"]
    test.isTrue (lang_tag of Package["tap:i18n"].TAPi18n.translations) and ("tap-tests:blank-package-tap-i18n" of Package["tap:i18n"].TAPi18n.translations[lang_tag])