Tinytest.add 'custom-package-tap-i18n - basic template rendered correctly', (test) ->
  test.equal Blaze.toHTML(Template.custom_tap_i18n_package__a01_template), "n01, n100"

Tinytest.add 'custom-package-tap-i18n - basic template that had been registered with registerI18nTemplate rendered correctly', (test) ->
  test.equal Blaze.toHTML(Template.custom_tap_i18n_package__a01_template__post_load), "n01, n100"

Tinytest.add 'custom-package-tap-i18n - basic template that had been registered with registerTemplate rendered correctly', (test) ->
  test.equal Blaze.toHTML(Template.custom_tap_i18n_package__a01_template__post_load__registered_with_registerTemplate), "n01, n100"
  