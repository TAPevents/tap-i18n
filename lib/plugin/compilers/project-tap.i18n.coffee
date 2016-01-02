helpers = share.helpers
compilers = share.compilers
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
  preloaded_langs:
    type: [String]
    label: "Preload languages"
    defaultValue: []
    optional: true
  cdn_path:
    type: String
    label: "Unified languages files path on CDN"
    defaultValue: null
    optional: true

getProjectConfJs = share.getProjectConfJs = (conf) ->
  fallback_language_name = language_names[globals.fallback_language]

  project_conf_js = """
    TAPi18n._enable(#{JSON.stringify(conf)});
    TAPi18n.languages_names["#{globals.fallback_language}"] = #{JSON.stringify fallback_language_name};

  """

  # If we get a list of supported languages we must make sure that we'll have a
  # language name for each one of its languages.
  #
  # Though languages names are added for every language we find i18n.json file
  # for (by the i18n.json compiler). We shouldn't rely on the existence of
  # *.i18n.json file for each supported language, because a language might be
  # defined as supported even when it has no i18n.json files (it's especially
  # true when tap:i18n is used with tap:i18n-db)
  if conf.supported_languages?
    for lang_tag in conf.supported_languages
      if language_names[lang_tag]?
        project_conf_js += """
          TAPi18n.languages_names["#{lang_tag}"] = #{JSON.stringify language_names[lang_tag]};

        """

  return project_conf_js

class ProjectTapCompiler extends CachingCompiler
  constructor: ->
    super
      compilerName: 'project_tap_i18n'
      defaultCacheSize: 1024*1024

  processFilesForTarget: (inputFiles) ->
    if inputFiles.length > 1
      inputFiles[1].error
        message: "Can't have more than one project-tap.i18n"

    super(inputFiles)

  getCacheKey: (inputFile) ->
    inputFile.getSourceHash()

  compileOneFile: (inputFile) ->
    input_path = inputFile.getDisplayPath()

    if inputFile.getPackageName() != null
      return inputFile.error
        message: "Can't load project-tap.i18n in a package: #{inputFile.getPackageName()}"

    project_tap_i18n = helpers.loadJSON(inputFile)

    if not project_tap_i18n?
      project_tap_i18n = schema.clean {}
    schema.clean project_tap_i18n

    try
      check project_tap_i18n, schema
    catch error
      return inputFile.error
        message: "File `#{file_path}' is an invalid project-tap.i18n file (#{error})"

    project_i18n_js_file = getProjectConfJs project_tap_i18n

    if "web" in inputFile.getArch() and not _.isEmpty project_tap_i18n.preloaded_langs
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

  compileResultSize: (compileResult) ->
    compileResult.length

  addCompileResult: (inputFile, compileResult) ->
    inputFile.addJavaScript
      path: "project-i18n.js"
      sourcePath: inputFile.getPathInPackage()
      data: compileResult
      bare: false

Plugin.registerCompiler
  filenames: ["project-tap.i18n"]
, -> new ProjectTapCompiler()
