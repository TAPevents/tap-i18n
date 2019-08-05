Tinytest.add 'custom-package-tap-i18n - TAPi18n.packages generated correctly', (test) ->
  test.equal Package["tap:i18n"].TAPi18n.packages, {"tap-tests:custom-package-tap-i18n":{"translation_function_name":"i18n_func","helper_name":"i18n_helper","namespace":"tap-tests:blank-package-tap-i18n"}}

Tinytest.add 'custom-package-tap-i18n - package translation function works as expected', (test) ->
  test.equal custom_tap_i18n_package__translate("a01"), "n01"
  test.equal custom_tap_i18n_package__translate("a02"), "nX2"
  test.equal custom_tap_i18n_package__translate("a100"), "n100"

Tinytest.add 'custom-package-tap-i18n - package translation function translates to fallback language when package language is specified', (test) ->
  test.equal custom_tap_i18n_package__translate("a01", {}, "bb"), "n01"
  test.equal custom_tap_i18n_package__translate("a02", {}, "bb"), "nX2"
  test.equal custom_tap_i18n_package__translate("a100", {}, "bb"), "n100"
