helpers = share.helpers
compiler_configuration = share.compiler_configuration

schema = new SimpleSchema
  translation_function_name:
    type: String
    defaultValue: "__"
    label: "Translation Function Name"
    optional: true
  helper_name:
    type: String
    defaultValue: "_"
    label: "Helper Name"
    optional: true

Plugin.registerSourceHandler "package-tap.i18n", (compileStep) ->
  compiler_configuration.registerInputFile(compileStep)

  if helpers.isPackage(compileStep)
    compileStep.error
      message: "More than one package-tap.i18n found for package: #{compileStep.packageName}",
      sourcePath: compileStep.inputPath
    return

  if helpers.isProjectI18nLoaded(compileStep)
    compileStep.error
      message: "Can't compile package-tap.i18n if project-tap.i18n is present",
      sourcePath: compileStep.inputPath
    return

  if helpers.isDefaultProjectConfInserted(compileStep)
    compileStep.error
      message: "package-tap.i18n should be loaded before languages files (*.i18n.json)",
      sourcePath: compileStep.inputPath
    return

  helpers.markAsPackage(compileStep)

  package_tap_i18n = helpers.loadJSON compileStep.inputPath, compileStep

  if not package_tap_i18n?
  	package_tap_i18n = schema.clean {}
  schema.clean package_tap_i18n

  try
    check package_tap_i18n, schema
  catch error
    compileStep.error
      message: "File `#{file_path}' is an invalid package-tap.i18n file (#{error})",
      sourcePath: compileStep.inputPath
    return

  package_name = compileStep.packageName

  package_i18n_js_file =
    """
    TAPi18n.packages["#{package_name}"] = #{JSON.stringify(package_tap_i18n)};

    // define package's translation function (proxy to the i18next)
    #{package_tap_i18n.translation_function_name} = TAPi18n._getPackageI18nextProxy("#{package_name}");

    """

  if compileStep.archMatches "web"
    package_i18n_js_file +=
      """
      // define the package's templates registrar
      registerI18nTemplate = TAPi18n._getRegisterHelpersProxy("#{package_name}");
      registerTemplate = registerI18nTemplate; // XXX OBSOLETE, kept for backward compatibility will be removed in the future

      // Record the list of templates prior to package load
      _ = Package.underscore._;
      Template = Package.templating.Template;
      if (typeof Template !== "object") {
        non_package_templates = [];
      } else {
        non_package_templates = _.keys(Template);
      }

      """

  compileStep.addJavaScript
    path: "package-i18n.js",
    sourcePath: compileStep.inputPath,
    data: package_i18n_js_file,
    bare: false
