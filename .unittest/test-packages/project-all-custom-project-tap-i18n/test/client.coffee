Tinytest.addAsync 'project with all custom project-tap.i18n - en loads correctly', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "en"

  dfd.done ->
    test.equal Blaze.toHTML(Template.project__all_custom_tap_i18n__basic_template), "n01, n05, n10, n100"
    test.equal Blaze.toHTML(Template.project__all_custom_tap_i18n__templates_introduced_by_packages), "n00, n01, nX2, n100 n00, n01, nX2, n100 n00, n01, nX2, n100 n00, n01, nX2, n100 n00, n01, nX2, n100 n00, n01, nX2, n100 n00, n01, nx2, n100, n101 n00, n01, nx2, n100, n101 n00, n01, nx2, n100, n101 n00, n01, nx2, n100 n00, n01, nx2, n100 n00, n01, nx2, n100 n101"
    test.equal "#{TAPi18n.__("a01")}, #{TAPi18n.__("a05")}, #{TAPi18n.__("a10")}, #{TAPi18n.__("a100")}", "n01, n05, n10, n100"

  dfd.fail ->
    test.fail "Failed to load language"

  dfd.always ->
    onComplete()

Tinytest.addAsync 'project with all custom project-tap.i18n - bb language that isn\'t one of the supported_languages fails to load.', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "bb"

  fail = false

  dfd.fail ->
    fail = true

  dfd.always ->
    test.isTrue fail

    onComplete()

Tinytest.addAsync 'project with all custom project-tap.i18n - cc-CC loads correctly. fallback to English when needed', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "cc-CC"

  dfd.done ->
    test.equal Blaze.toHTML(Template.project__all_custom_tap_i18n__basic_template), "C01, n05, n10, n100"
    test.equal Blaze.toHTML(Template.project__all_custom_tap_i18n__templates_introduced_by_packages), "C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, Cx2, n100, n101 C00, C01, Cx2, n100, n101 C00, C01, Cx2, n100, n101 C00, C01, Cx2, n100 C00, C01, Cx2, n100 C00, C01, Cx2, n100 n101"
    test.equal "#{TAPi18n.__("a01")}, #{TAPi18n.__("a05")}, #{TAPi18n.__("a10")}, #{TAPi18n.__("a100")}", "C01, n05, n10, n100"

  dfd.fail ->
    test.fail "Failed to load language"

  dfd.always ->
    onComplete()

Tinytest.addAsync 'project with all custom project-tap.i18n - dd language which is not supported fails to load.', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "dd"

  fail = false

  dfd.fail ->
    fail = true

  dfd.always ->
    test.isTrue fail

    onComplete()
