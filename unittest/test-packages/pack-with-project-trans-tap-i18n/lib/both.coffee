custom_tap_i18n_package__translate = (string, options, language) ->
  i18n_func(string, options, language)

TAPi18n.loadTranslations(
  bb: a00: "b00", a02: "-02"
  cc: a00: "c00", a02: "-02"
  "cc-CC": a00: "C00", a02: "-02"
  dd: a00: "d00", a02: "-02"
  en: a00: "n00", a02: "-02"
  "project"
)

TAPi18n.loadTranslations(
  bb: a02: "bx2"
  cc: a02: "cx2"
  "cc-CC": a02: "Cx2"
  dd: a02: "dx2"
  en: a02: "nx2"
  "project"
)
