_ = Npm.require 'underscore'
path = Npm.require 'path'
fs = Npm.require 'fs'
crypto = Npm.require 'crypto'

project_root = process.cwd()

langauges_tags_regex = globals.langauges_tags_regex
fallback_language = globals.fallback_language

sha1 = (contents) ->
  hash = crypto.createHash('sha1')
  hash.update(contents)
  hash.digest('hex')

# package-tap.i18n Schemas
packageTapI18nSchema =
  new SimpleSchema
    #default_language:
    #  type: String
    #  defaultValue: "en"
    #  label: "Default Language"
    languages_files_dir:
      type: String
      defaultValue: "i18n"
      label: "Languages Files Dir"

# project-tap.i18n Schemas
#default_build_files_path = path.join project_root, "public", "i18n"
default_build_files_path = path.join project_root, ".meteor", "local", "tap-i18n"
default_browser_path = globals.default_browser_path
projectTapI18nSchema =
  new SimpleSchema
    languages_files_dir:
      type: String
      defaultValue: "i18n"
      label: "Languages Files Dir"
    #default_language:
    #  type: String
    #  defaultValue: "en"
    #  regEx: RegExp("^#{langauges_tags_regex}$")
    #  label: "Default Language"
    supported_languages:
      type: [String]
      label: "Supported Languages"
      optional: true
      autoValue: ->
        if (not @isSet) or @value == null
          return null

        value = @value

        value = _.filter(value, (lang_tag) -> RegExp("^#{langauges_tags_regex}$").test(lang_tag))
        
        dialects_base_languages = value.map (lang_tag) -> lang_tag.replace(RegExp("^#{langauges_tags_regex}$"), "$1")
        
        # add the fallback_language and the supported dialects base languages - they are always supported
        _.union [fallback_language], dialects_base_languages, value

        # # add "en", the default_language and the supported dialects base
        # languages - they are always supported
        # _.union ["en", (@field "default_language").value], dialects_base_languages, value
    build_files_path:
      type: String
      label: "Build Files Path"
      autoValue: ->
        value = null

        if @isSet
          value = removeFileTrailingSeparator @value

        value
      optional: true
    browser_path:
      type: String
      label: "Browser Path"
      autoValue: ->
        # Make sure browser_path has no trailing slash
        value = if @isSet then @value else default_browser_path
        
        removeFileTrailingSeparator value

# Helpers
log = ->
  if globals.debug or process.env.TAP_I18N_DEBUG == "true"
    console.log.apply @,
      [
        "[INFO] tap-i18n compiler", new Date().toISOString().replace(/.*T/, "").replace(/\..*/, "") + ":"
      ].concat Array.prototype.slice.apply(arguments)

escapeRegExp = (str) ->
  str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")

removeFileTrailingSeparator = (file) ->
  file.trim().replace RegExp("#{escapeRegExp path.sep}$"), ""

loadProjectConf = (conf_file=path.join(project_root, 'project-tap.i18n')) ->
  # Returns the project's tap-i18n configuration if tap-i18n is installed
  # (enabled) for that project, or null if tap-i18n is not installed (disabled).
  #
  # If tap-i18n is enabled and conf_file exists we try override the default
  # project configurations with the those configured by it. Otherwise we return
  # the default configurations.
  # 
  # If conf_file is not a valid JSON or doesn't pass our verifications we throw
  # a Meteor error.
  #
  # Attributes:
  # conf_file: the path to the project's project-tap.i18n file.

  try
    project_packages = fs.readFileSync(path.resolve(project_root, ".meteor", "packages"), {encoding: "utf8"}).split("\n")
  catch error
    throw new Meteor.Error 500, "Can't determine whether tap-i18n is enabled or not (can't load .meteor/packages)",
      {conf_file: conf_file, error: error}

  # tap-i18n is disabled return null
  # XXX I allow the use of the environmental variable TAP_I18N to indicate that
  # tap-i18n is enabled since the packages in use when testing
  # (package.on_test) aren't listed in .meteor/packages and I don't know of a
  # more straightforward way to indicate whether tap-i18n is enabled or not in
  # that case
  if (not _.contains project_packages, "tap-i18n") and (process.env.TAP_I18N != "enabled")
    return null

  # If conf_file doesn't exist return the defaults
  if not fs.existsSync conf_file
    return projectTapI18nSchema.clean({})

  # load project-tap.i18n, clean and validate it
  try
    project_tap_i18n_json = JSON.parse(fs.readFileSync(conf_file))
  catch error
    throw new Meteor.Error 500, "Can't load project-tap.i18n JSON",
      {conf_file: conf_file, error: error}

  projectTapI18nSchema.clean(project_tap_i18n_json)

  try
    check project_tap_i18n_json, projectTapI18nSchema
  catch error
    throw new Meteor.Error 500, "Invalid project-tap.i18n: #{error.message}",
      {error: error, project_tap_i18n_json: project_tap_i18n_json}

  return project_tap_i18n_json

loadPackageTapI18n = (file_path) ->
  # Load and parse package-tap.i18n files
  #
  # Returns a clean and verified tap-i18n package configuration object as
  # defined by packageTapI18nSchema.
  #
  # If file_path doens't exists, is not a valid JSON or doesn't pass our
  # verifications we throw a Meteor error.
  #
  # We consider packages with empty package-tap.i18n file to be tap-i18n
  # enabled. So if file_path points to an empty file we treat it as if it was
  # an empty JSON object.
  #
  # Attributes:
  # file_path: the path to the package-tap.i18n file.

  try # use try/catch to avoid the additional syscall to fs.existsSync
    fstats = fs.statSync file_path
  catch
    throw new Meteor.Error 500, "Package file `#{file_path}' doesn't exist",
      {file_path: file_path}

  if fstats.size == 0
    return packageTapI18nSchema.clean {}

  try
    package_tap_i18n_json = JSON.parse(fs.readFileSync(file_path))
  catch error
    throw new Meteor.Error 500, "Can't load `#{file_path}' JSON",
      {file_path: file_path, error: error}

  packageTapI18nSchema.clean package_tap_i18n_json

  try
    check package_tap_i18n_json, packageTapI18nSchema
  catch error
    throw new Meteor.Error 500, "File `#{file_path}' is an invalid package-tap.i18n file",
      {error: error, package_tap_i18n_json: package_tap_i18n_json}

  return package_tap_i18n_json

mapLangFilesDir = (lang_files_dir) ->
  # Generate an object of the form: { lang_tag: lang_file_path, ... }
  _.object(
    (
      (wrench.readdirSyncRecursive lang_files_dir, (x) -> RegExp("^#{langauges_tags_regex}.i18n.json$").test(x))
        .map (file) ->
          file.replace(".i18n.json", "")
    ).map (language_name) ->
      [language_name, lang_files_dir + path.sep + language_name + ".i18n.json"]
  )

loadPackageTapMap = (package_tap_i18n_file_path) ->
  map = {}
  map.conf = loadPackageTapI18n package_tap_i18n_file_path
  map.path = path.dirname package_tap_i18n_file_path
  map.name = path.basename map.path
  map.lang_files_dir = map.path + path.sep + map.conf.languages_files_dir

  if not fs.existsSync map.lang_files_dir
    throw new Meteor.Error 500, "Can't find the languages files path of the package `#{map.name}' (#{map.lang_files_dir})."

  map.lang_files_paths = mapLangFilesDir map.lang_files_dir

  return map

buildUnifiedLangFiles = (compileStep=null, lang_files_path=default_build_files_path, supported_languages=null, project_translations_dir=null) ->
  # Build the unified languages files on lang_files_path
  #
  # Returns a list of all the languages to which a unified file was built
  #
  # Attributes:
  # lang_files_path (string): the path we build the unified languages files to
  # supported_languages (array or null): Array of languages tags to which
  # unified files will be built. If null, a unified language file will be built
  # for any language the project or the packages it uses have a been translated
  # to. It's guarenteed that a unified language file will be generated for each
  # supported language even if no translations for this language is available
  # (in which case the file will have an empty JSON object).

  log "Building unified files directory: #{lang_files_path}"

  lang_files_path = removeFileTrailingSeparator lang_files_path
  lang_files_backup_path = "#{lang_files_path}~"

  getLangFilePath = (lang) ->
    lang_files_path + path.sep + lang + ".json"

  # Remove old backup
  try
    wrench.rmdirSyncRecursive lang_files_backup_path
    log "Old languages files backup #{lang_files_backup_path} removed"
  catch error

  # Create a backup for current lang_files_path
  try
    fs.renameSync lang_files_path, lang_files_backup_path
    log "[IMPORTANT] unified languages files folder #{lang_files_path} already exists. Backing it up"
    log "[IMPORTANT] to #{lang_files_backup_path}. If you need to, save the backup before building your"
    log "[IMPORTANT] project again - otherwise you'll lose it."
  catch error

  # Create the new languages files dir
  try
    wrench.mkdirSyncRecursive lang_files_path, 0o744 # 0744 - owner: rwx, rest: r
  catch error
    throw new Meteor.Error 500, "Can't create folder `#{lang_files_path}'",
      {error: error}

  # A rollback procedure to use on failure
  rollback = ->
    log "Build failed, rolling back `#{lang_files_path}'"
    wrench.rmdirSyncRecursive lang_files_path
    try
      fs.renameSync lang_files_backup_path, lang_files_path
    catch error

  packageTapI18nMaps =
    (wrench.readdirSyncRecursive project_root, (x) -> /package-tap.i18n$/.test(x)).map (x) -> loadPackageTapMap(x)

  if project_translations_dir?
    if fs.existsSync project_translations_dir
      project_lang_files_dir_map = mapLangFilesDir project_translations_dir
      packageTapI18nMaps.push {
          name: globals.project_translations_domain
          lang_files_paths: project_lang_files_dir_map
      }

      # If compileStep is defined and we have "en
      if compileStep? and fallback_language of project_lang_files_dir_map
        fallback_language_file = project_lang_files_dir_map[fallback_language]

        try
          lang_json = JSON.parse(fs.readFileSync(fallback_language_file))
        catch error
          throw new Meteor.Error 500, "Project fallback language file (#{fallback_language}) has an invalid JSON: `#{fallback_language_file}'",
            {file_path: fallback_language_file, error: error}

        if not _.isObject lang_json
          throw new Meteor.Error 500, "Project fallback language file (#{fallback_language}) should contain a JSON object: `#{fallback_language_file}'",
            {file_path: fallback_language_file}

        project_fallback_lang_translation_js_file =
          """
          // add the package translations for the fallback language
          TAPi18next.addResourceBundle('#{fallback_language}', '#{globals.project_translations_domain}', #{JSON.stringify lang_json});

          """

        compileStep.addJavaScript
          path: "project-fallback-lang-translations.js",
          sourcePath: compileStep.inputPath,
          data: project_fallback_lang_translation_js_file,
          bare: false

    else
      log "Couldn't find project translations directory - no project level translations"

  unified_languages_files = {}
  _.each packageTapI18nMaps, (package_map) ->
    languages_files = package_map.lang_files_paths

    # Make sure package has a translation file for the fallback language
    if not (fallback_language of languages_files)
      rollback()
      throw new Meteor.Error 500, "Package #{package_map.name} has no language file for the fallback language (#{fallback_language})"

    # Make sure we have the base language translations file for every dialect
    dialects = _.filter _.keys(languages_files), (lang) ->
      "-" in lang
    _.each dialects, (dialect) ->
      base_language = (dialect.split "-")[0]
      if not (base_language of languages_files)
        rollback()
        throw new Meteor.Error 500, "Package #{package_map.name} has no language file for the base language (#{base_language}) of the dialect (#{dialect})"

    if supported_languages
      # pick from languages_files only the supported languages
      languages_files = _.pick(languages_files, _.intersection(_.keys(languages_files), supported_languages))

    log "Gathering #{package_map.name} languages files"
    _.each languages_files, (file_path, lang)->
      # Skip the fallback language since it is built into the project there is
      # no need to build a unified file for it
      if lang == fallback_language
        return

      # Make sure the language JSON is valid
      try
        lang_json = JSON.parse(fs.readFileSync(file_path))
      catch error
        rollback()

        throw new Meteor.Error 500, "Failed to build unified languages files. Invalid JSON in language file: `#{file_path}' of package #{package_map.name}",
          {file_path: file_path, error: error}

      if not _.isObject lang_json
        rollback()

        throw new Meteor.Error 500, "Failed to build unified languages files. The JSON in language file: `#{file_path}' of package #{package_map.name} is not an object.",
          {file_path: file_path}

      # if we haven't created a unified file for this file's language, create one
      if not (lang of unified_languages_files)
        lang_file_path = getLangFilePath lang

        try
          unified_languages_files[lang] = fs.openSync lang_file_path, "w", 0o644
        catch error
          rollback()

          throw new Meteor.Error 500, "Failed to build unified languages files. Failed to create a file: #{lang_file_path}",
            {lang_file_path: lang_file_path, error: error}

        fs.writeSync unified_languages_files[lang], "{\"#{package_map.name}\": "
      else # if there is already a unified file for this language
        fs.writeSync unified_languages_files[lang], ",\"#{package_map.name}\": "

      # write the package translations to the unified JSON
      fs.writeSync unified_languages_files[lang], JSON.stringify lang_json

  # Close the unified files JSONs
  _.each unified_languages_files, (v, lang) ->
    fs.writeSync unified_languages_files[lang], "}"
    # Fails even with the catch for a reason...
    #try
    #  fs.closeSync unified_languages_files[supported_lang]
    #catch

  # If a list of supported_languages had been given, create an empty unified
  # lang file for every supported language haven't found translations for
  _.each _.difference(supported_languages, _.keys(unified_languages_files)), (lang) ->
    # Skip the fallback language since it is built into the project there is no
    # need to build a unified file for it
    if lang == fallback_language
      return

    try
      unified_languages_files[lang] = getLangFilePath lang
      fs.writeFileSync unified_languages_files[lang], "{}"
    catch error
      rollback()

      throw new Meteor.Error 500, "Failed to build unified languages files. Failed to create a file: #{lang_file_path}",
        {lang_file_path: unified_languages_files[lang], error: error}

  log "Done building unified languages files"

  return _.keys unified_languages_files

build_files_once_log = {}
build_files_once_arch_log = {}
projectTapI18n = null
buildFilesOnce = (compileStep) ->
  # Builds the unified languages files and the project configuration (for each
  # arch) once per build cycle

  # To tell whether or not we are in a new build cycle we assume that if the
  # same file triggered a call to that function for the same architecture we
  # are in a new cycle
  current_step_file = "#{compileStep._fullInputPath}::#{compileStep.arch}"

  # Do the following once per build cycle regardless of arch
  #
  # If the build_files_once_log is empty or if the current_step_file is already
  # in the log - we are in a new build cycle
  if _.isEmpty(build_files_once_log) or (current_step_file of build_files_once_log)
    # Init logs
    build_files_once_log = {}
    build_files_once_arch_log = {}

    # Reload the project configuration
    projectTapI18n = loadProjectConf()

    # Build the unified languages files only if tap-i18n is enabled in the
    # project level
    if projectTapI18n?
      langs_with_unified_lang_files =
        buildUnifiedLangFiles compileStep, projectTapI18n.build_files_path, projectTapI18n.supported_languages, projectTapI18n.languages_files_dir

      # If the supported languages for that project haven't been specified - all
      # the languages we have a unified language file for (and the fallback
      # language) are supported 
      projectTapI18n.supported_languages ?= _.union([fallback_language], langs_with_unified_lang_files)

    else
      log "tap-i18n is not enabled in the project level, don't build unified languages files"

  # Once per ARCH per build cycle
  if not (compileStep.arch of build_files_once_arch_log)
    if projectTapI18n?
      # If tap-i18n is enabled, add the project configurations to the TAPi18n
      # object if we haven't done that for the current arch already. (remember:
      # for tap-i18n disabled projects TAPi18n.conf is null) 
      project_i18n_js_file =
        """
        TAPi18n.conf = #{JSON.stringify projectTapI18n};

        """

      compileStep.addJavaScript
        path: "project-i18n.js",
        sourcePath: compileStep.inputPath,
        data: project_i18n_js_file,
        bare: false

    build_files_once_arch_log[compileStep.arch] = true

  # Same build cycle - log file
  build_files_once_log[current_step_file] = true

# Plugins
Plugin.registerSourceHandler "i18n", (compileStep) ->
  # Do nothing, Meteor requires us to have a plugin for .i18n in order to
  # register plugins for .project-tap.i18n and .tap.i18n

# templatesRegistrationsNeeded and the process of tap-i18n package-specific
# templates registration:
# In the code we add during the compilation of package-tap.i18n we record the
# registered Meteor templates.
# The package developer must add his proejct's package-tap.i18n before the load
# of any package template, and the package's i18n.json files after the load of
# all the package templates (See README).
# That enables us to check for the registered Meteor templates before and after
# the package adds its own, to distinguish them and add the package specific
# tap-i18n helpers to them.
# Since there might be more than one i18n.json file, and we need to check for
# the package's templates and add the tap-i18n helpers only once, we use
# templatesRegistrationsNeeded as an indicatore for whether we've add the
# code already or not.
templatesRegistrationsNeeded = false
current_package_name = null
Plugin.registerSourceHandler "package-tap.i18n", (compileStep) ->
  log "package-tap.i18n file found #{compileStep._fullInputPath}: building"

  # Remember that whenever any of the package's i18n.json files will change
  # Meteor will build the entire package so this handler will be called
  buildFilesOnce compileStep

  # From here on, keep building only the browser arch
  if not compileStep.archMatches 'browser'
    return

  # We make English an integral part of the package build.
  # We do this regardless of whether or not the containing project enables
  # tap-i18n since the same Meteor package copy might be shared by more than
  # one Meteor projects (meteorite for instance stores all the packages in a
  # centralized directory and use symlinks to add them to the project's
  # packages dir).
  # That of course means the package build must be agnostic to the containing
  # project configuration.
  package_map = loadPackageTapMap compileStep._fullInputPath
  package_name = package_map.name
  lang_files_paths = package_map.lang_files_paths

  if not (fallback_language of lang_files_paths)
    throw new Meteor.Error 500, "Package #{package_name} has no language file for the fallback language (#{fallback_language})"

  fallback_language_file = lang_files_paths[fallback_language]

  try
    lang_json = JSON.parse(fs.readFileSync(fallback_language_file))
  catch error
    throw new Meteor.Error 500, "Package #{package_name} fallback language file (#{fallback_language}) has an invalid JSON: `#{fallback_language_file}'",
      {file_path: fallback_language_file, error: error}

  if not _.isObject lang_json
    throw new Meteor.Error 500, "Package #{package_name} fallback language file (#{fallback_language}) should contain a JSON object: `#{fallback_language_file}'",
      {file_path: fallback_language_file}

  package_i18n_js_file =
    """
    // add the package translations for the fallback language
    TAPi18next.addResourceBundle('#{fallback_language}', '#{package_name}', #{JSON.stringify lang_json});

    // add the package's proxies to tap-i18next
    __ = TAPi18n._getPackageI18nextProxy("#{package_name}");
    registerTemplate = TAPi18n._getPackageRegisterTemplateHelperProxy("#{package_name}");

    // Record list of templates prior to package load
    _ = Package.underscore._;
    Template = Package.templating.Template;
    if (typeof Template !== "object") {
      non_package_templates = [];
    } else {
      non_package_templates = _.keys(Template);
    }

    """

  compileStep.addJavaScript
    path: "#{package_name}-package-i18n.js",
    sourcePath: compileStep.inputPath,
    data: package_i18n_js_file,
    bare: false

  # See the above note titled: templatesRegistrationsNeeded and the process of
  # tap-i18n package-specific templates registration
  templatesRegistrationsNeeded = true
  current_package_name = package_name

Plugin.registerSourceHandler "project-tap.i18n", (compileStep) ->
  log "project-tap.i18n file found #{compileStep._fullInputPath}: building"

  # Build the project files
  buildFilesOnce compileStep

Plugin.registerSourceHandler "i18n.json", (compileStep) ->
  # Build only for the browser arch
  if not compileStep.archMatches 'browser'
    return

  # Build the project files
  buildFilesOnce compileStep

  # Add the sha1 of the .i18n.json files as a comment to the build js, so
  # Meteor will know when it was changed and will refresh the clients.
  # This is needed because (except for the fallback language) the content of
  # the .i18n.json files isn't added to the built js and therefore Meteor can't
  # tell when they are changed, and won't refresh the client unless we'll
  # indicate that.
  compileStep.addJavaScript
    path: compileStep.inputPath,
    sourcePath: compileStep.inputPath,
    data: "// #{compileStep.inputPath}: #{sha1(fs.readFileSync compileStep._fullInputPath)}",
    bare: true

  # See the above note titled: templatesRegistrationsNeeded and the process of
  # tap-i18n package-specific templates registration
  if templatesRegistrationsNeeded
    package_i18n_templates_registration_js_file =
      """
      var package_templates = _.difference(_.keys(Template), non_package_templates);

      for (var i = 0; i < package_templates.length; i++) {
        var package_template = package_templates[i];

        registerTemplate(package_template);
      }

      """

    compileStep.addJavaScript
      path: "i18n-templates-registration.js",
      sourcePath: compileStep.inputPath,
      data: package_i18n_templates_registration_js_file,
      bare: false

    templatesRegistrationsNeeded = false
