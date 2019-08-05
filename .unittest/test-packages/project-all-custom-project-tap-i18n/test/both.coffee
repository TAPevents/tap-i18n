Tinytest.add 'project with all custom project-tap.i18n - TAPi18n.conf generated correctly', (test) ->
  test.equal TAPi18n.conf, {"helper_name":"i18n","supported_languages":["cc-CC","he"],"i18n_files_route":"/i18n_files/","cdn_path":"/i18n_files/","preloaded_langs":[]}

Tinytest.add 'project with all custom project-tap.i18n - TAPi18n._getProjectLanguages() return expected value', (test) ->
  test.equal TAPi18n._getProjectLanguages(), ["en", "cc-CC", "he"]

Tinytest.add 'project with all custom project-tap.i18n - TAPi18n.getLanguages() return expected value', (test) ->
  test.equal TAPi18n.getLanguages(), {"en":{"name":"English","en":"English"},"cc-CC":{"name":"cc-CC","en":"cc-CC"},"he":{"name":"עברית","en":"Hebrew"}}

Tinytest.add 'project with all custom project-tap.i18n - project translation function works as expected', (test) ->
  test.equal TAPi18n.__("a01"), "n01"
  test.equal TAPi18n.__("a02"), "nx2"
  test.equal TAPi18n.__("a100"), "n100"
