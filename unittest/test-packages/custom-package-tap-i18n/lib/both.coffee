custom_tap_i18n_package__translate = (string, options, language) ->
  i18n_func(string, options, language)

TAPi18n.loadTranslations(
  bb: a00: "b00", a02: "-02"
  cc: a00: "c00", a02: "-02"
  "cc-CC": a00: "C00", a02: "-02"
  dd: a00: "d00", a02: "-02"
  en: a00: "n00", a02: "-02"
  "tap-tests:blank-package-tap-i18n" # Check package-tap.i18n to see why we don't use custom-package-tap-i18n
)

# The following overwrite the previous translations, and the translations that
# were set in blank-package-tap-i18n package. They also break the rules set by
# translation files to verify correct priority
TAPi18n.loadTranslations(
  bb: a02: "bX2"
  cc: a02: "cX2"
  "cc-CC": a02: "CX2"
  dd: a02: "dX2"
  en: a02: "nX2"
  "tap-tests:blank-package-tap-i18n"
)
