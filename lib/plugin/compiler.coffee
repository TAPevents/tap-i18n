helpers = share.helpers

class TAPi18nCompiler extends CachingCompiler
  constructor: ->
    super
      compilerName: 'project_tap_i18n'
      defaultCacheSize: 1024*1024*10

    @configuration =
      fallback_language: globals.fallback_language
      packages: [] # Each time we compile package-tap.i18n we push "package_name:arch" to this array
      templates_registered_for: [] # Each time we register a template we push "package_name:arch" to this array
      setDefaultProjectConfIn: null

  getLanguage: (inputFile) ->
    inputFile.getBasename().split(".").slice(0, -2).pop()

  getCacheKey: (inputFile) ->
    [
      inputFile.getSourceHash(),
      @getCompileStepArchAndPackage(inputFile),
      @getLanguage(inputFile),
      @configuration
    ]

  isConfigFile: (inputFile) ->
    inputFile.getBasename() in ["package-tap.i18n", "project-tap.i18n"]

  isClient: (inputFile) ->
    /^web/.test(inputFile.getArch())

  isServer: (inputFile) ->
    /^os/.test(inputFile.getArch())

  getCompileStepArchAndPackage: (inputFile) ->
    "#{inputFile.getArch()}:#{inputFile.getPackageName()}"

  processFilesForTarget: (inputFiles) ->
    filterFilename = (filename) ->
      _.filter(inputFiles, (f) -> f.getBasename() == filename)

    packageTapFiles = filterFilename("package-tap.i18n")
    projectTapFiles = filterFilename("project-tap.i18n")

    sortedInputFiles = _.sortBy(inputFiles, (f) => if @isConfigFile(f) then -1 else 1)

    if packageTapFiles.length > 1
      packageName = inputFiles[1].getPackageName()
      packageTapFiles[1].error
        message: "Can't have more than one package-tap.i18n found for package: #{packageName}"

    if projectTapFiles.length > 1
      projectTapFiles[1].error
        message: "Can't have more than one project-tap.i18n"
    else if projectTapFiles.length == 0
      @configuration.setDefaultProjectConfIn = @getLanguage sortedInputFiles[sortedInputFiles.length - 1]
    else
      @configuration.setDefaultProjectConfIn = null

    super(sortedInputFiles)

  compileOneFile: (inputFile) ->
    if inputFile.getBasename() == "package-tap.i18n"
      return @compilePackageTapFile(inputFile)
    else if inputFile.getBasename() == "project-tap.i18n"
      return @compileProjectTapFile(inputFile)
    else
      return @compileI18nJsonFile(inputFile)

  compileI18nJsonFile: (inputFile) ->
    input_path = inputFile.getPathInPackage()

    language = @getLanguage(inputFile)
    if _.isUndefined(language) or _.isEmpty(language)
      inputFile.error
        message: "Language-tag is not specified for *.i18n.json file: `#{input_path}'",
        sourcePath: input_path
      return

    if not RegExp("^#{globals.languages_tags_regex}$").test(language)
      inputFile.error
        message: "Can't recognise '#{language}' as a language-tag: `#{input_path}'",
        sourcePath: input_path
      return

    translations = helpers.loadJSON(inputFile)

    package_name = inputFile.getPackageName() || globals.project_translations_domain
    output =
      """
      var _ = Package.underscore._,
          package_name = "#{package_name}",
          namespace = "#{package_name}";

      if (package_name != "#{globals.project_translations_domain}") {
          namespace = TAPi18n.packages[package_name].namespace;
      }

      """

    # only for project
    if not inputFile.getPackageName()
      if /^(client|server)/.test(input_path)
        inputFile.error
          message: "Languages files should be common to the server and the client. Do not put them under /client or /server .",
          sourcePath: input_path
        return

      # add the language names to TAPi18n.languages_names
      language_name = [language, language]
      if language_names[language]?
        language_name = language_names[language]

      if language != globals.fallback_language
        # the name for the fallback_language is part of the getProjectConfJs()'s output
        output +=
          """
          TAPi18n.languages_names["#{language}"] = #{JSON.stringify language_name};

          """

      # If this is a project but project-tap.i18n haven't compiled yet add default project conf
      # for case there is no project-tap.i18n defined in this project.
      # Reminder: we don't require projects to have project-tap.i18n
      if @configuration.setDefaultProjectConfIn == @getLanguage inputFile
        output += share.getProjectConfJs(share.project_i18n_schema.clean {}) # defined in project-tap.i18n.coffee

    # if fallback_language -> integrate, otherwise add to TAPi18n.translations if server arch.
    if language == @configuration.fallback_language
      output +=
        """
        // integrate the fallback language translations
        translations = {};
        translations[namespace] = #{JSON.stringify translations};
        TAPi18n._loadLangFileObject("#{@configuration.fallback_language}", translations);

        """

    if @isServer(inputFile)
      if language != @configuration.fallback_language
        output +=
          """
          if(_.isUndefined(TAPi18n.translations["#{language}"])) {
            TAPi18n.translations["#{language}"] = {};
          }

          if(_.isUndefined(TAPi18n.translations["#{language}"][namespace])) {
            TAPi18n.translations["#{language}"][namespace] = {};
          }

          _.extend(TAPi18n.translations["#{language}"][namespace], #{JSON.stringify translations});

          """

      output +=
        """
        TAPi18n._registerServerTranslator("#{language}", namespace);

        """

    # register i18n helper for templates, only once per web arch, only for packages
    if helpers.isPackage(inputFile)
      if @isClient(inputFile) and @getCompileStepArchAndPackage(inputFile) not in @configuration.templates_registered_for
        output +=
          """
          var package_templates = _.difference(_.keys(Template), non_package_templates);

          for (var i = 0; i < package_templates.length; i++) {
            var package_template = package_templates[i];

            registerI18nTemplate(package_template);
          }

          """
        @configuration.templates_registered_for.push @getCompileStepArchAndPackage(inputFile)

    return output

  compilePackageTapFile: (inputFile) ->
    input_path = inputFile.getDisplayPath()
    package_name = inputFile.getPackageName()

    package_tap_i18n = helpers.loadJSON(inputFile)
    schema = share.package_i18n_schema

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

    if @isClient(inputFile)
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

  compileProjectTapFile: (inputFile) ->
    input_path = inputFile.getDisplayPath()

    if inputFile.getPackageName() != null
      return inputFile.error
        message: "Can't load project-tap.i18n in a package: #{inputFile.getPackageName()}"

    project_tap_i18n = helpers.loadJSON(inputFile)
    schema = share.project_i18n_schema

    if not project_tap_i18n?
      project_tap_i18n = schema.clean {}
    schema.clean project_tap_i18n

    try
      check project_tap_i18n, schema
    catch error
      return inputFile.error
        message: "File `#{file_path}' is an invalid project-tap.i18n file (#{error})"

    project_i18n_js_file = share.getProjectConfJs project_tap_i18n

    if @isClient(inputFile) and not _.isEmpty project_tap_i18n.preloaded_langs
      preloaded_langs = "all"
      if project_tap_i18n.preloaded_langs[0] != "*"
        preloaded_langs = project_tap_i18n.preloaded_langs.join(",")

      project_i18n_js_file +=
        """
        $.ajax({
            type: 'GET',
            url: "#{project_tap_i18n.i18n_files_route}/multi/#{preloaded_langs}.json",
            dataType: 'json',
            success: function(data) {
              for (lang_tag in data) {
                TAPi18n._loadLangFileObject(lang_tag, data[lang_tag]);
                TAPi18n._loaded_languages.push(lang_tag);
              }
            },
            data: {},
            async: false
        });

        """

    helpers.markProjectI18nLoaded(compileStep)
    return project_i18n_js_file

  _outputFilePath: (inputFile) ->
    if inputFile.getBasename() == "package-tap.i18n"
      "package-i18n.js"
    else if inputFile.getBasename() == "project-tap.i18n"
      "project-i18n.js"
    else
      inputFile.getPathInPackage().replace /json$/, "js"

  compileResultSize: (compileResult) ->
    compileResult.length

  addCompileResult: (inputFile, compileResult) ->
    inputFile.addJavaScript
      path: @_outputFilePath inputFile
      sourcePath: inputFile.getPathInPackage()
      data: compileResult
      bare: false

Plugin.registerCompiler
  filenames: ["package-tap.i18n", "project-tap.i18n"]
  extensions: ["i18n.json"]
, -> new TAPi18nCompiler()
