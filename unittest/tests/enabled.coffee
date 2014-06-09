# Note that this unittest runs for all the tests in which tap-i18n is enabled
fallback_language = "en"

Tinytest.add 'Enabled tap-i18n - TAPi18n.conf is not null', (test) ->
  test.isNotNull TAPi18n

Tinytest.add 'Enabled tap-i18n - Fallback language is in supported_languages', (test) ->
  test.include TAPi18n.conf.supported_languages, fallback_language

Tinytest.addAsync 'Enabled tap-i18n - All languages loads successfully', (test, onComplete) ->
  dfd = null

  test_pack_a_supporeted_languages = ["bb", "cc-CC", "cc", "en"]

  _.each test_pack_a_supporeted_languages, (lang) ->
    do (lang) ->
      if dfd == null
        dfd = TAPi18n.setLanguage lang
      else
        dfd = dfd.then ->
          TAPi18n.setLanguage lang

      dfd.done ->
        test.equal Template.pack_a_test_template_a.render()(), "#{_.last lang}01"

      dfd.fail ->
        test.fail "Failed to load language #{lang}"

  dfd.always ->
    onComplete()
