helpers = share.helpers
compilers = share.compilers
compiler_configuration = share.compiler_configuration

package_i18n_obj_schema =
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
  namespace:
    type: String
    defaultValue: null
    label: "Translations Namespace"
    optional: true

packageI18nObjCleaner = helpers.buildCleanerForSchema(package_i18n_obj_schema, "package-tap.i18n")

compilers.packageTapI18n = (input_file_obj) ->
  compiler_configuration.registerInputFile(input_file_obj)
  input_path = helpers.getFullInputPath input_file_obj

  if helpers.isPackage(input_file_obj)
    input_file_obj.error
      message: "More than one package-tap.i18n found for package: #{input_file_obj.getPackageName()}",
      sourcePath: input_path
    return

  if helpers.isProjectI18nLoaded(input_file_obj)
    input_file_obj.error
      message: "Can't compile package-tap.i18n if project-tap.i18n is present",
      sourcePath: input_path
    return

  if helpers.isDefaultProjectConfInserted(input_file_obj)
    input_file_obj.error
      message: "package-tap.i18n should be loaded before languages files (*.i18n.json)",
      sourcePath: input_path
    return

  helpers.markAsPackage(input_file_obj)

  package_tap_i18n = helpers.loadJSON input_file_obj

  if not package_tap_i18n?
    package_tap_i18n = packageI18nObjCleaner({})
  else
    packageI18nObjCleaner(package_tap_i18n)

  package_name = input_file_obj.getPackageName()

  if not package_tap_i18n.namespace?
    package_tap_i18n.namespace = package_name

  namespace = package_tap_i18n.namespace

  package_i18n_js_file =
    """
    TAPi18n.packages["#{package_name}"] = #{JSON.stringify(package_tap_i18n)};

    // define package's translation function (proxy to the i18next)
    #{package_tap_i18n.translation_function_name} = TAPi18n._getPackageI18nextProxy("#{namespace}");

    """

  if helpers.archMatches input_file_obj, "web"
    package_i18n_js_file +=
      """
      // define the package's templates registrar
      registerI18nTemplate = TAPi18n._getRegisterHelpersProxy("#{package_name}");
      registerTemplate = registerI18nTemplate; // XXX OBSOLETE, kept for backward compatibility will be removed in the future

      // Record the list of templates prior to package load
      var _ = Package.underscore._;
      non_package_templates = _.keys(Template);

      """

  return input_file_obj.addJavaScript
    path: "package-i18n.js",
    sourcePath: input_path,
    data: package_i18n_js_file,
    bare: false
