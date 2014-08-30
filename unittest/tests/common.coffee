Tinytest.add 'Common i18n Tests - Text translates to the fallback language correctly', (test) ->
  test.equal share.render(Template.pack_a_test_template_a), "n01"
