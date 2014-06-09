document.title = "UnitTest: tap-i18n enabled in the project level default configuration"

Tinytest.add 'Enabled tap-i18n defaults options - TAPi18n.conf.supported_languages contains all the languages the project and the packages it uses offer', (test) ->
  test.isNotNull TAPi18n.conf.supported_languages
  test.equal TAPi18n.conf.supported_languages.slice().sort(), ["en", "bb", "cc", "cc-CC", "dd"].sort()

Tinytest.add 'Enabled tap-i18n defaults options - Make sure TAPi18n.conf.build_files_path is null', (test) ->
  test.isNull TAPi18n.conf.build_files_path
