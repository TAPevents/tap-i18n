Tinytest.addAsync 'project with no project-tap.i18n - en loads correctly', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "en"

  dfd.done ->
    test.equal Blaze.toHTML(Template.project__no_project_tap_i18n__basic_template), "n01, n05, n10, n100"
    test.equal "#{TAPi18n.__("a01")}, #{TAPi18n.__("a05")}, #{TAPi18n.__("a10")}, #{TAPi18n.__("a100")}", "n01, n05, n10, n100"

  dfd.fail ->
    test.fail "Failed to load language #{lang}"

  dfd.always ->
    onComplete()

Tinytest.addAsync 'project with no project-tap.i18n - bb loads correctly. fallback to English when needed', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "bb"

  dfd.done ->
    test.equal Blaze.toHTML(Template.project__no_project_tap_i18n__basic_template), "b01, b05, n10, n100"
    test.equal "#{TAPi18n.__("a01")}, #{TAPi18n.__("a05")}, #{TAPi18n.__("a10")}, #{TAPi18n.__("a100")}", "b01, b05, n10, n100"

  dfd.fail ->
    test.fail "Failed to load language #{lang}"

  dfd.always ->
    onComplete()


Tinytest.addAsync 'project with no project-tap.i18n - cc-CC loads correctly. fallback to English when needed', (test, onComplete) ->
  dfd = TAPi18n.setLanguage "cc-CC"

  dfd.done ->
    test.equal Blaze.toHTML(Template.project__no_project_tap_i18n__basic_template), "C01, n05, n10, n100"
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
