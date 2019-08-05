Tinytest.addAsync 'project with no project-tap.i18n - project translation function translates to a non fallback language as expected', (test, onComplete) ->
  count = 0
  Tracker.autorun ->
    if count == 0
      test.equal Blaze.toHTML(Template.project__no_project_tap_i18n__basic_template__ccCC), "n01, nx2, n05, n10, n100"

      test.equal TAPi18n.__("a01", {}, "cc-CC"), "n01"
      test.equal TAPi18n.__("a05", {}, "cc-CC"), "n05"
      count += 1
    else
      test.equal Blaze.toHTML(Template.project__no_project_tap_i18n__basic_template__ccCC), "C01, Cx2, n05, n10, n100"

      test.equal TAPi18n.__("a01", {}, "cc-CC"), "C01"
      test.equal TAPi18n.__("a05", {}, "cc-CC"), "n05"

      onComplete()

Tinytest.addAsync 'project with no project-tap.i18n - _prepareLanguageSpecificTranslator() doesn\'t change i18next underlying lang', (test, onComplete) ->
  current_underlying_lang = TAPi18next.lng()

  lang_to_prepare = "cc-CC"
  if current_underlying_lang == lang_to_prepare
    lang_to_prepare = "bb"

  dfd = TAPi18n._prepareLanguageSpecificTranslator lang_to_prepare
  dfd.done ->
    test.notEqual TAPi18next.lng(), lang_to_prepare
    onComplete()

Tinytest.addAsync 'project with no project-tap.i18n - en loads correctly', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "en"

  dfd.done ->
    test.equal Blaze.toHTML(Template.project__no_project_tap_i18n__basic_template), "n01, nx2, n05, n10, n100"
    test.equal Blaze.toHTML(Template.project__no_project_tap_i18n__templates_introduced_by_packages), "n00, n01, nX2, n100 n00, n01, nX2, n100 n00, n01, nX2, n100 n00, n01, nX2, n100 n00, n01, nX2, n100 n00, n01, nX2, n100 n00, n01, nx2, n100 n00, n01, nx2, n100 n00, n01, nx2, n100"
    test.equal "#{TAPi18n.__("a01")}, #{TAPi18n.__("a02")}, #{TAPi18n.__("a05")}, #{TAPi18n.__("a10")}, #{TAPi18n.__("a100")}", "n01, nx2, n05, n10, n100"

  dfd.fail ->
    test.fail "Failed to load language #{lang}"

  dfd.always ->
    onComplete()

Tinytest.addAsync 'project with no project-tap.i18n - bb loads correctly. fallback to English when needed', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "bb"

  dfd.done ->
    test.equal Blaze.toHTML(Template.project__no_project_tap_i18n__basic_template), "b01, bx2, b05, n10, n100"
    test.equal "#{TAPi18n.__("a01")}, #{TAPi18n.__("a02")}, #{TAPi18n.__("a05")}, #{TAPi18n.__("a10")}, #{TAPi18n.__("a100")}", "b01, bx2, b05, n10, n100"

  dfd.fail ->
    test.fail "Failed to load language #{lang}"

  dfd.always ->
    onComplete()


Tinytest.addAsync 'project with no project-tap.i18n - cc-CC loads correctly. fallback to English when needed', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "cc-CC"

  dfd.done ->
    test.equal Blaze.toHTML(Template.project__no_project_tap_i18n__basic_template), "C01, Cx2, n05, n10, n100"
    test.equal Blaze.toHTML(Template.project__no_project_tap_i18n__templates_introduced_by_packages), "C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, CX2, n100 C00, C01, Cx2, n100 C00, C01, Cx2, n100 C00, C01, Cx2, n100"
    test.equal "#{TAPi18n.__("a01")}, #{TAPi18n.__("a05")}, #{TAPi18n.__("a10")}, #{TAPi18n.__("a100")}", "C01, n05, n10, n100"

  dfd.fail ->
    test.fail "Failed to load language #{lang}"

  dfd.always ->
    onComplete()

Tinytest.addAsync 'project with no project-tap.i18n - dd language which is not supported fails to load.', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "dd"

  fail = false

  dfd.fail ->
    fail = true

  dfd.always ->
    test.isTrue fail

    onComplete()
