document.title = "UnitTest: tap-i18n is enabled in the project level - project level translations"

Tinytest.addAsync 'Enabled tap-i18n with project level translations - All languages loads successfully', (test, onComplete) ->
  dfd = null

  project_supporeted_languages = ["cc-CC", "cc", "en"]

  _.each project_supporeted_languages, (lang) ->
    do (lang) ->
      if dfd == null
        dfd = TAPi18n.setLanguage lang
      else
        dfd = dfd.then ->
          TAPi18n.setLanguage lang

      dfd.done ->
        test.equal TAPi18n.__("a01"), "#{_.last lang}01"
        test.equal Template.project_template_a.render()(), "#{_.last lang}01"

      dfd.fail ->
        test.fail "Failed to load language #{lang}"

  dfd.always ->
    onComplete()
