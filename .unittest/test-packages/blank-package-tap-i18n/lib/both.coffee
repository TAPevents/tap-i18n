blank_tap_i18n_package__translate = (string, options, language) ->
  __(string, options, language)

TAPi18n.loadTranslations(
  bb: a00: "b00", a02: "-02"
  cc: a00: "c00", a02: "-02"
  "cc-CC": a00: "C00", a02: "-02"
  dd: a00: "d00", a02: "-02"
  en: a00: "n00", a02: "-02"
  "tap-tests:blank-package-tap-i18n"
)

# The following overwrite the previous translations and breaks the rules set by
# translation files to verify correct priority
TAPi18n.loadTranslations(
  bb: a02: "bx2"
  cc: a02: "cx2"
  "cc-CC": a02: "Cx2"
  dd: a02: "dx2"
  en: a02: "nx2"
  "tap-tests:blank-package-tap-i18n"
)
