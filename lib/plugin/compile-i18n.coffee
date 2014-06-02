_ = Npm.require 'underscore'
path = Npm.require 'path'
fs = Npm.require 'fs'

project_root = process.cwd()

langauges_tags_regex = "([a-z]{2})(-[A-Z]{2})?"

# package-tap.i18n Schemas
packageTapI18nSchema =
  new SimpleSchema
    default_language:
      type: String
      defaultValue: "en"
      label: "Default Language"
    languages_files_dir:
      type: String
      defaultValue: "i18n"
      label: "Languages Files Dir"

# project-tap.i18n Schemas
default_build_files_path = path.join project_root, "public", "i18n"
default_browser_path = "/i18n"
default_supported_languages = ["en"]
projectTapI18nSchema =
  new SimpleSchema
    #default_language:
    #  type: String
    #  defaultValue: "en"
    #  regEx: RegExp("^#{langauges_tags_regex}$")
    #  label: "Default Language"
    supported_languages:
      type: [String]
      label: "Supported Languages"
      autoValue: ->
        value = if @isSet then @value else default_supported_languages
        
        value = _.filter(value, (lang_tag) -> RegExp("^#{langauges_tags_regex}$").test(lang_tag))
        
        dialects_base_languages = value.map (lang_tag) -> lang_tag.replace(RegExp("^#{langauges_tags_regex}$"), "$1")
        
        # # add "en", the default_language and the supported dialects base
        # languages - they are always supported
        # _.union ["en", (@field "default_language").value], dialects_base_languages, value

        # add "en" and the supported dialects base languages - they are always supported
        _.union ["en"], dialects_base_languages, value
    build_files_path:
      type: String
      label: "Build Files Path"
      autoValue: ->
        # Make sure build_files_path has no trailing slash
        value = if @isSet then @value else default_build_files_path
        
        removeFileTrailingSeparator value
    browser_path:
      type: String
      label: "Browser Path"
      autoValue: ->
        # Make sure browser_path has no trailing slash
        value = if @isSet then @value else default_browser_path
        
        removeFileTrailingSeparator value

# Helpers
log = ->
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
  # (enabled) on that project, or null if tap-i18n is not installed (disabled).
  #
  # If tap-i18n is enabled and conf_file exists we try to load the
  # configurations from it, otherwise we return the default configurations.
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
  # more straightforward way to indicate enabled tap-i18n environment for testing
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

  if fs.existsSync file_path
    fstats = fs.statSync file_path
  else
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

loadPackageTapMap = (package_tap_i18n_file_path) ->
  map = {}
  map.conf = loadPackageTapI18n package_tap_i18n_file_path
  map.path = path.dirname package_tap_i18n_file_path
  map.name = path.basename map.path
  map.lang_files_dir = map.path + path.sep + map.conf.languages_files_dir

  if not fs.existsSync map.lang_files_dir
    throw new Meteor.Error 500, "Can't find the languages files path of the package `#{map.name}' (#{map.lang_files_dir}).",
      {error: error}

  # Generate an object of the form: { lang_tag: lang_file_path, ... }
  map.lang_files_paths =
    _.object(
      (
        (wrench.readdirSyncRecursive map.lang_files_dir, (x) -> RegExp("^#{langauges_tags_regex}.i18n.json$").test(x))
          .map (file) ->
            file.replace(".i18n.json", "")
      ).map (language_name) ->
        [language_name, map.lang_files_dir + path.sep + language_name + ".i18n.json"]
    )

  return map

buildUnifiedLangFiles = (lang_files_path=default_build_files_path, supported_languages=default_supported_languages) ->
  log "Building unified files directory: #{lang_files_path}"

  lang_files_path = removeFileTrailingSeparator lang_files_path
  lang_files_backup_path = "#{lang_files_path}~"

  getLangFilePath = (lang) ->
    lang_files_path + path.sep + lang + ".tap-i18n.json"

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
    fs.renameSync lang_files_backup_path, lang_files_path

  packageTapI18nMaps =
    (wrench.readdirSyncRecursive project_root, (x) -> /package-tap.i18n$/.test(x)).map (x) -> loadPackageTapMap(x)

  unified_languages_files = {}
  _.each packageTapI18nMaps, (package_map) ->
    # pick from the package_map.lang_files_path only the supported languages
    supported_languages_files = _.pick(package_map.lang_files_paths, _.intersection(_.keys(package_map.lang_files_paths), supported_languages))

    log "Gathering #{package_map.name} languages files"
    _.each supported_languages_files, (file_path, lang)->
      # Make sure all languages JSONs are valid
      try
        lang_json = JSON.parse(fs.readFileSync(file_path))
      catch error
        rollback()

        throw new Meteor.Error 500, "Failed to build unified languages files. Invalid JSON in language file: `#{file_path}' of package #{package_map.name}",
          {file_path: file_path, error: error}

      if not _.isObject lang_json
        rollback()

        throw new Meteor.Error 500, "Failed to build unified languages files. The JSON in language file: `#{file_path}' of package #{package_map.name} is not an object.",
          {file_path: file_path, error: error}

      # if we haven't created a file for this language of the current file yet
      if not (lang of unified_languages_files)
        lang_file_path = getLangFilePath lang

        try
          unified_languages_files[lang] = fs.openSync lang_file_path, "w", 0o644
        catch error
          rollback()

          throw new Meteor.Error 500, "Failed to build unified languages files. Failed to create a file: #{lang_file_path}",
            {lang_file_path: lang_file_path, error: error}

        # add the package property to the lang unified JSON
        fs.writeSync unified_languages_files[lang], "{\"#{package_map.name}\": "
      else # if there is already a file for this language
        # add the package property to the lang unified JSON
        fs.writeSync unified_languages_files[lang], ",\"#{package_map.name}\": "

      # write the package strings to the unified JSON
      fs.writeSync unified_languages_files[lang], JSON.stringify lang_json

  supported_languages.forEach (supported_lang) ->
    if supported_lang of unified_languages_files
      fs.writeSync unified_languages_files[supported_lang], "}"
      # Failse even with the catch for a reason...
      #try
      #  fs.closeSync unified_languages_files[supported_lang]
      #catch
    else
      try
        lang_file_path = getLangFilePath supported_lang
        fs.writeFileSync lang_file_path, "{}"
      catch error
        rollback()

        throw new Meteor.Error 500, "Failed to build unified languages files. Failed to create a file: #{lang_file_path}",
          {lang_file_path: lang_file_path, error: error}

  log "Done building unified languages files"

build_project_unified_lang_files_once_log = {}
buildProjectUnifiedLangFilesOnce = (compileStep) ->
  # Build the unified languages files once per build cycle

  # To tell whether or not we are in a new build cycle we assume that if the
  # same file triggered a call to that function we are in a new cycle.

  current_step_file = compileStep._fullInputPath

  # If the log is empty or if the current_step_file is already in the log - we
  # are in a new build cycle
  if _.isEmpty(build_project_unified_lang_files_once_log) or (current_step_file of build_project_unified_lang_files_once_log)
    build_project_unified_lang_files_once_log = {}
    projectTapI18n = loadProjectConf()
    # Build only if tap-i18n is enabled in the project level
    if projectTapI18n?
      # Add the project configurations to the TAPi18n object and set "en" as the
      # fallback language (instead of "dev")
      project_i18n_js_file =
        """
        TAPi18next.fallbackLng = ["en"];
        TAPi18n.conf = #{JSON.stringify projectTapI18n};

        """

      compileStep.addJavaScript
        path: "project-i18n.js",
        sourcePath: compileStep.inputPath,
        data: project_i18n_js_file,
        bare: false

      buildUnifiedLangFiles projectTapI18n.build_files_path, projectTapI18n.supported_languages
    else
      log "tap-i18n is not enabled in the project level, don't build unified languages files"

  # Same build cycle - log file
  build_project_unified_lang_files_once_log[current_step_file] = true

# Plugins
Plugin.registerSourceHandler "i18n", (compileStep) ->
  # Do nothing, Meteor require us to have a plugin for .i18n to register
  # project-tap.i18n and tap.i18n

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

  if not compileStep.archMatches 'browser'
    throw new Meteor.Error 500, "package-tap.i18n should only be added to the browser environment"

  # We put the call to buildProjectUnifiedLangFilesOnce here and not under the
  # i18n.json plugin since whenever one of the package's i18n.json files will
  # change we want to rebuild the unified files. But we want to do so only if
  # tap-i18n is enabled in the package level, i.e. if package-tap.i18n exists
  # (and since we are here it for sure does).
  # Remember that whenever any of the package's i18n.json files will change
  # Meteor will build the entire package so this plugin will be called.
  buildProjectUnifiedLangFilesOnce compileStep

  # We make the package default language an integral part of the package build.
  # We do this regardless of whether or not the containing project enables
  # tap-i18n since the same Meteor package copy might be shared by more than
  # one Meteor projects (meteorite for instance stores all the packages in a
  # centralized directory and use symlinks to add them to the project's
  # packages dir).
  # That of course means the package build must be agnostic to the containing
  # project configuration.
  #
  # The packages default language is registered to TAPi18next (our isolated
  # i18next copy) under the language name: dev which is the default i18n
  # fallback language that way packages can use at the same time their
  # different default languages when tap-i18n is disabled in the project-level. 
  package_map = loadPackageTapMap compileStep._fullInputPath
  package_name = package_map.name
  default_language = package_map.conf.default_language
  lang_files_paths = package_map.lang_files_paths

  if not (default_language of lang_files_paths)
    throw new Meteor.Error 500, "There is no language file for the default language (#{default_language}) of the package #{package_name}"

  try
    lang_json = JSON.parse(fs.readFileSync(lang_files_paths[default_language]))
  catch error
    throw new Meteor.Error 500, "Invalid JSON in the default language file: `#{lang_files_paths[default_language]}' of package #{package_name}",
      {file_path: lang_files_paths[default_language], error: error}

  if not _.isObject lang_json
    throw new Meteor.Error 500, "Language file should contain a JSON object. #{lang_files_paths[default_language]}",
      {file_path: lang_files_paths[default_language], error: error}

  package_i18n_js_file =
    """
    // add the package default language (for case tap-i18n is not enabled in the project level)
    TAPi18next.addResourceBundle('dev', '#{package_name}', #{JSON.stringify lang_json});

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
  # Since project-tap.i18n should be in the project root, Meteor will try to
  # build it both for the browser and the server arch - for non-browser we want
  # to do nothing
  if not compileStep.archMatches 'browser'
    return

  log "project-tap.i18n file found #{compileStep._fullInputPath}: building"

  # Build the unified languages files
  buildProjectUnifiedLangFilesOnce compileStep

Plugin.registerSourceHandler "i18n.json", (compileStep) ->
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

