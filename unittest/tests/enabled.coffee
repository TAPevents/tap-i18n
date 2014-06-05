# Note that this unittest runs for all the tests in which tap-i18n is enabled
document.title = "UnitTest: tap-i18n enabled in the project level default configuration"

fallback_language = "en"

Tinytest.add 'Enabled tap-i18n - TAPi18n.conf is not null', (test) ->
  test.isNotNull TAPi18n

Tinytest.add 'Enabled tap-i18n - Fallback language is in supported_languages', (test) ->
  test.include TAPi18n.conf.supported_languages, fallback_language
