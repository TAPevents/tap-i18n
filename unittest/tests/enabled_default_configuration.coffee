Tinytest.add 'Enabled tap-i18n - TAPi18n.conf.supported_languages contains all the languages the project and the packages it uses offer', (test) ->
  test.isNotNull TAPi18n.conf.supported_languages
  test.equal TAPi18n.conf.supported_languages.slice().sort(), ["en", "bb", "cc", "cc-CC", "dd"].sort()
