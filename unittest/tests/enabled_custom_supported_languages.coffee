Tinytest.add 'Custom Supported Languages - Supported languages array cleaned correctly', (test) ->
  expected_supported_languages = ["en", "bb", "cc", "cc-CC", "xx", "xx-XX"]

  test.equal expected_supported_languages.slice().sort(), TAPi18n.conf.supported_languages.slice().sort()

Tinytest.addAsync 'Custom Supported Languages - Supported languages that no package supports load correctly', (test, onComplete) ->
  TAPi18n._loadLanguage "xx-XX"
    .done ->
      test.ok()
    .fail (m) ->
      console.log m
      test.fail()
    .always ->
      onComplete()
