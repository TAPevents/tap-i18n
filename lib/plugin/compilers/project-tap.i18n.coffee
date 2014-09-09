helpers = share.helpers
compiler_configuration = share.compiler_configuration

share.project_i18n_schema = schema = new SimpleSchema
  helper_name:
    type: String
    defaultValue: "_"
    label: "Helper Name"
    optional: true
  supported_languages:
    type: [String]
    label: "Supported Languages"
    defaultValue: null
    optional: true
  i18n_files_route:
    type: String
    label: "Unified languages files path"
    defaultValue: globals.browser_path
    optional: true
  cdn_path:
    type: String
    label: "Unified languages files path on CDN"
    defaultValue: null
    optional: true

getProjectConfJs = share.getProjectConfJs = (conf) ->
  fallback_language_name = language_names[globals.fallback_language]

  """
    TAPi18n.conf = #{JSON.stringify(conf)};
    TAPi18n.languages_available_for_project["#{globals.fallback_language}"] = #{JSON.stringify fallback_language_name};
    TAPi18n[TAPi18n.conf.helper_name] = TAPi18n._getPackageI18nextProxy("#{globals.project_translations_domain}");

  """

Plugin.registerSourceHandler "project-tap.i18n", (compileStep) ->
  compiler_configuration.registerInputFile(compileStep)

  if helpers.isPackage(compileStep)
    compileStep.error
      message: "Can't load project-tap.i18n in a package: #{compileStep.packageName}",
      sourcePath: compileStep.inputPath
    return

  if helpers.isProjectI18nLoaded(compileStep)
    compileStep.error
      message: "Can't have more than one project-tap.i18n",
      sourcePath: compileStep.inputPath
    return

  project_tap_i18n = helpers.loadJSON compileStep.inputPath, compileStep

  if not project_tap_i18n?
    project_tap_i18n = schema.clean {}
  schema.clean project_tap_i18n

  try
    check project_tap_i18n, schema
  catch error
    compileStep.error
      message: "File `#{file_path}' is an invalid project-tap.i18n file (#{error})",
      sourcePath: compileStep.inputPath
    return

  project_i18n_js_file = getProjectConfJs project_tap_i18n

  helpers.markProjectI18nLoaded(compileStep)

  compileStep.addJavaScript
    path: "project-i18n.js",
    sourcePath: compileStep.inputPath,
    data: project_i18n_js_file,
    bare: false
