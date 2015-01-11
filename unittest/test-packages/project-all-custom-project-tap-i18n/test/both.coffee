Tinytest.add 'project with all custom project-tap.i18n - TAPi18n.conf generated correctly', (test) ->
  test.equal TAPi18n.conf, {"helper_name":"i18n","supported_languages":["cc-CC"],"i18n_files_route":"/i18n_files/","cdn_path":"http://localhost:3000/i18n_files/"}

Tinytest.add 'project with all custom project-tap.i18n - TAPi18n._getProjectLanguages() return expected value', (test) ->
  test.equal TAPi18n._getProjectLanguages(), ["en", "cc-CC"]

Tinytest.add 'project with all custom project-tap.i18n - TAPi18n.getLanguages() return expected value', (test) ->
  test.equal TAPi18n.getLanguages(), {"en":{"name":"English","en":"English"},"bb":{"name":"bb","en":"bb"},"cc-CC":{"name":"cc-CC","en":"cc-CC"}}

Tinytest.add 'project with all custom project-tap.i18n - project translation function works as expected', (test) ->
  test.equal TAPi18n.__("a01"), "n01"
  test.equal TAPi18n.__("a02"), "nx2"
  test.equal TAPi18n.__("a100"), "n100"
