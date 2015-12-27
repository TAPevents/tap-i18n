helpers = share.helpers
compilers = share.compilers
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
  namespace:
    type: String
    defaultValue: null
    label: "Translations Namespace"
    optional: true

class PackageTapCompiler extends CachingCompiler
  constructor: ->
    super
      compilerName: 'project_tap_i18n'
      defaultCacheSize: 1024*1024

  processFilesForTarget: (inputFiles) ->
    if inputFiles.length > 1
      packageName = inputFiles[1].getPackageName()
      inputFiles[1].error
        message: "Can't have more than one package-tap.i18n found for package: #{packageName}"

    super(inputFiles)

  getCacheKey: (inputFile) ->
    inputFile.getSourceHash()

  compileOneFile: (inputFile) ->
    input_path = inputFile.getDisplayPath()
    package_name = inputFile.getPackageName()

    # if helpers.isProjectI18nLoaded(compileStep)
    #   inputFile.error
    #     message: "Can't compile package-tap.i18n if project-tap.i18n is present",
    #     sourcePath: input_path
    #   return

    # if helpers.isDefaultProjectConfInserted(compileStep)
    #   inputFile.error
    #     message: "package-tap.i18n should be loaded before languages files (*.i18n.json)",
    #     sourcePath: input_path
    #   return

    package_tap_i18n = helpers.loadJSON(inputFile)

    if not package_tap_i18n?
      package_tap_i18n = schema.clean {}
    schema.clean package_tap_i18n

    try
      check package_tap_i18n, schema
    catch error
      inputFile.error
        message: "File `#{file_path}' is an invalid package-tap.i18n file (#{error})",
        sourcePath: input_path
      return

    if not package_tap_i18n.namespace?
      package_tap_i18n.namespace = package_name

    namespace = package_tap_i18n.namespace

    package_i18n_js_file =
      """
      TAPi18n.packages["#{package_name}"] = #{JSON.stringify(package_tap_i18n)};

      // define package's translation function (proxy to the i18next)
      #{package_tap_i18n.translation_function_name} = TAPi18n._getPackageI18nextProxy("#{namespace}");

      """

    if "web" in inputFile.getArch()
      package_i18n_js_file +=
        """
        // define the package's templates registrar
        registerI18nTemplate = TAPi18n._getRegisterHelpersProxy("#{package_name}");
        registerTemplate = registerI18nTemplate; // XXX OBSOLETE, kept for backward compatibility will be removed in the future

        // Record the list of templates prior to package load
        var _ = Package.underscore._;
        non_package_templates = _.keys(Template);

        """

    return package_i18n_js_file

  compileResultSize: (compileResult) ->
    compileResult.length

  addCompileResult: (inputFile, compileResult) ->
    inputFile.addJavaScript
      path: "package-i18n.js"
      sourcePath: inputFile.getPathInPackage()
      data: compileResult
      bare: false

Plugin.registerCompiler
  filenames: ["package-tap.i18n"]
, -> new PackageTapCompiler()
