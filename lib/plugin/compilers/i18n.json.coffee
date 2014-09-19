path = Npm.require "path"

helpers = share.helpers
compiler_configuration = share.compiler_configuration

Plugin.registerSourceHandler "i18n.json", (compileStep) ->
  compiler_configuration.registerInputFile(compileStep)

  language = path.basename(compileStep.inputPath).split(".").slice(0, -2).pop()
  if _.isUndefined(language) or _.isEmpty(language)
    compileStep.error
      message: "Language-tag is not specified for *.i18n.json file: `#{compileStep.inputPath}'",
      sourcePath: compileStep.inputPath
    return

  if not RegExp("^#{globals.langauges_tags_regex}$").test(language)
    compileStep.error
      message: "Can't recognise '#{language}' as a language-tag: `#{compileStep.inputPath}'",
      sourcePath: compileStep.inputPath
    return

  translations = helpers.loadJSON compileStep.inputPath, compileStep

  output =
    """
    _ = Package.underscore._;

    """

  # only for project
  if not helpers.isPackage(compileStep)
    # add the language names to TAPi18n.languages_available_for_project 
    language_name = [language, language]
    if language_names[language]?
      language_name = language_names[language]
    output +=
      """
      TAPi18n.languages_available_for_project["#{language}"] = #{JSON.stringify language_name};

      """

    # If this is a project but project-tap.i18n haven't compiled yet add default project conf
    # for case there is no project-tap.i18n defined in this project.
    # Reminder: we don't require projects to have project-tap.i18n
    if not(helpers.isDefaultProjectConfInserted(compileStep)) and \
       not(helpers.isProjectI18nLoaded(compileStep))
      output += share.getProjectConfJs(share.project_i18n_schema.clean {}) # defined in project-tap.i18n.coffee

      helpers.markDefaultProjectConfInserted(compileStep)

  # if fallback_language -> integrate, otherwise add to TAPi18n.translations if server arch.
  package_name = if helpers.isPackage(compileStep) then compileStep.packageName else globals.project_translations_domain
  if language == compiler_configuration.fallback_language
    output +=
    """
    // integrate the fallback language translations 
    TAPi18n.addResourceBundle("#{compiler_configuration.fallback_language}", "#{package_name}", #{JSON.stringify translations});

    """
  else if compileStep.archMatches "os"
    output +=
    """
    if(_.isUndefined(TAPi18n.translations["#{language}"])) {
      TAPi18n.translations["#{language}"] = {};
    }

    if(_.isUndefined(TAPi18n.translations["#{language}"]["#{package_name}"])) {
      TAPi18n.translations["#{language}"]["#{package_name}"] = {};
    }

    _.extend(TAPi18n.translations["#{language}"]["#{package_name}"], #{JSON.stringify translations});

    """

  # register i18n helper for templates, only once per web arch, only for packages
  if helpers.isPackage(compileStep)
    if compileStep.archMatches("web") and helpers.getCompileStepArchAndPackage(compileStep) not in compiler_configuration.templates_registered_for
      output +=
        """
        var package_templates = _.difference(_.keys(Template), non_package_templates);

        for (var i = 0; i < package_templates.length; i++) {
          var package_template = package_templates[i];

          registerI18nTemplate(package_template);
        }

        """
      compiler_configuration.templates_registered_for.push helpers.getCompileStepArchAndPackage(compileStep)

  output_path = compileStep.inputPath.replace /json$/, "js"
  compileStep.addJavaScript
    path: output_path,
    sourcePath: compileStep.inputPath,
    data: output,
    bare: false
