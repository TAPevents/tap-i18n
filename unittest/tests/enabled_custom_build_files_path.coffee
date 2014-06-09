document.title = "UnitTest: tap-i18n is enabled in the project level custom build files path is set on project-tap.i18n"

Tinytest.add 'Enabled tap-i18n custom build files path - Make sure TAPi18n.conf.build_files_path is correct', (test) ->
  test.equal TAPi18n.conf.build_files_path, "public/x"

Tinytest.add 'Enabled tap-i18n custom build files path - Make sure TAPi18n.conf.browser_path is correct', (test) ->
  test.equal TAPi18n.conf.browser_path, "/x"
