# Note that this unittest runs for all the tests in which tap-i18n is enabled
fallback_language = "en"

test_pack_a_supporeted_languages = ["bb", "cc-CC", "cc", "en"]

Tinytest.add 'Enabled tap-i18n - TAPi18n.conf is not null', (test) ->
  test.isNotNull TAPi18n

Tinytest.add 'Enabled tap-i18n - Fallback language is in supported_languages', (test) ->
  test.include TAPi18n.conf.supported_languages, fallback_language

Tinytest.addAsync 'Enabled tap-i18n - All languages loads successfully', (test, onComplete) ->
  dfd = null

  _.each test_pack_a_supporeted_languages, (lang) ->
    do (lang) ->
      if dfd == null
        dfd = TAPi18n.setLanguage lang
      else
        dfd = dfd.then ->
          TAPi18n.setLanguage lang

      dfd.done ->
        test.equal share.render(Template.pack_a_test_template_a), "#{_.last lang}01"
        test.equal share.render(Template.pack_a_test_template_post_load_template), "#{_.last lang}01"

      dfd.fail ->
        test.fail "Failed to load language #{lang}"

  dfd.always ->
    onComplete()

Tinytest.addAsync 'Enabled tap-i18n - {{languageTag}}', (test, onComplete) ->
  dfd = null

  _.each test_pack_a_supporeted_languages, (lang) ->
    do (lang) ->
      if dfd == null
        dfd = TAPi18n.setLanguage lang
      else
        dfd = dfd.then ->
          TAPi18n.setLanguage lang

      dfd.done ->
        test.equal share.render(Template.project_template_languageTag), lang

      dfd.fail ->
        test.fail "Failed to load language #{lang}"

  dfd.always ->
    onComplete()

Tinytest.add 'Enabled tap-i18n - getLanguages method return correct data for all supported languages', (test) ->
  languages_info = TAPi18n.getLanguages()
  _.each languages_info, (info, lang_tag) ->
    if lang_tag != "en"
      test.equal(info.name, lang_tag)
      test.equal(info.en, lang_tag)
    else
      test.equal(info.name, "English")
      test.equal(info.en, "English")
