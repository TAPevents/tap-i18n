document.title = "UnitTest: tap-i18n disabled in the project level"

Tinytest.add 'Disabled tap-i18n - TAPi18n is not defined', (test) ->
  test.isTrue typeof TAPi18n == "undefined"
