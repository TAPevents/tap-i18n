Tinytest.add 'blank-package-tap-i18n - TAPi18n.packages generated correctly', (test) ->
  test.equal Package["tap:i18n"].TAPi18n.packages, {"tap-tests:blank-package-tap-i18n":{"translation_function_name":"__","helper_name":"_","namespace":"tap-tests:blank-package-tap-i18n"}}

Tinytest.add 'blank-package-tap-i18n - package translation function works as expected', (test) ->
  test.equal blank_tap_i18n_package__translate("a01"), "n01"
  test.equal blank_tap_i18n_package__translate("a02"), "nx2"
  test.equal blank_tap_i18n_package__translate("a100"), "n100"

Tinytest.add 'blank-package-tap-i18n - package translation function translates to fallback language when package language is specified', (test) ->
  test.equal blank_tap_i18n_package__translate("a01", {}, "bb"), "n01"
  test.equal blank_tap_i18n_package__translate("a02", {}, "bb"), "nx2"
  test.equal blank_tap_i18n_package__translate("a100", {}, "bb"), "n100"
