Tinytest.add 'project with all custom project-tap.i18n - project translations are added to TAPi18n.translations', (test) ->
  for lang_tag in ["bb", "cc-CC"]
    test.isTrue (lang_tag of TAPi18n.translations) and ("project" of TAPi18n.translations[lang_tag])

  for lang_tag in ["dd"]
    test.isTrue (lang_tag not of TAPi18n.translations) or ("project" not of TAPi18n.translations[lang_tag])

Tinytest.add 'project with all custom project-tap.i18n - project translation function translates to a non fallback language as expected', (test) ->
  test.equal TAPi18n.__("a01", {}, "cc-CC"), "C01"
  test.equal TAPi18n.__("a05", {}, "cc-CC"), "n05"
