Tinytest.add 'Custom Supported Languages - Supported languages array cleaned correctly', (test) ->
  expected_supported_languages = ["en", "bb", "cc", "cc-CC", "xx", "xx-XX"]

  test.isTrue _.isEmpty(_.difference(expected_supported_languages, TAPi18n.conf.supported_languages)) and
              _.isEmpty(_.difference(TAPi18n.conf.supported_languages, expected_supported_languages)),
              'TAPi18n.conf.supported_languages contains the expected languages tags'

Tinytest.addAsync 'Custom Supported Languages - Supported languages that no package supports are being built and loads', (test, onComplete) ->
  d = TAPi18n._loadLanguage "xx-XX"
    .done ->
      test.ok()
    .fail (m) ->
      console.log m
      test.fail()
    .always ->
      onComplete()
  console.log d
