path = Npm.require "path"

helpers = share.helpers
compilers = share.compilers
compiler_configuration = share.compiler_configuration

compilers.generic_compiler = (extension, helper) -> 
  GenericCompiler = ->
    @processFilesForTarget = (input_files) ->
      input_files.forEach (input_file) ->
        compiler_configuration.registerInputFile input_file
        
        input_path = helpers.getFullInputPath input_file
        language = path.basename(input_path).split(".").slice(0, -2).pop()
        if _.isUndefined(language) or _.isEmpty(language)
          input_file.error
            message: "Language-tag is not specified for *.i18n.`#{extension}' file: `#{input_path}'",
            sourcePath: input_path
          return

        if not RegExp("^#{globals.langauges_tags_regex}$").test(language)
          input_file.error
            message: "Can't recognise '#{language}' as a language-tag: `#{input_path}'",
            sourcePath: input_path
          return

        translations = helper input_file

        package_name = if helpers.isPackage(input_file) then input_file.getPackageName() else globals.project_translations_domain
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
        if not helpers.isPackage(input_file)
          if /^(client|server)/.test input_file.getPathInPackage()
            input_file.error
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
          if not(helpers.isDefaultProjectConfInserted(input_file)) and \
            not(helpers.isProjectI18nLoaded(input_file))
            output += share.getProjectConfJs(share.projectI18nObjCleaner({})) # defined in project-tap.i18n.coffee

            helpers.markDefaultProjectConfInserted(input_file)


        # if fallback_language -> integrate, otherwise add to TAPi18n.translations if server arch.
        if language == compiler_configuration.fallback_language
          output +=
            """
            // integrate the fallback language translations 
            translations = {};
            translations[namespace] = #{JSON.stringify translations};
            TAPi18n._loadLangFileObject("#{compiler_configuration.fallback_language}", translations);

            """

        if helpers.archMatches input_file, "os"
          if language != compiler_configuration.fallback_language
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
        if helpers.isPackage input_file
          if helpers.archMatches(input_file, "web") and helpers.getCompileStepArchAndPackage(input_file) not in compiler_configuration.templates_registered_for
            output +=
              """
              var package_templates = _.difference(_.keys(Template), non_package_templates);

              for (var i = 0; i < package_templates.length; i++) {
                var package_template = package_templates[i];

                registerI18nTemplate(package_template);
              }

              """
            compiler_configuration.templates_registered_for.push helpers.getCompileStepArchAndPackage(input_file)

        output_path = input_file.getPathInPackage().replace new RegExp("`#{extension}'$"), "js"
        input_file.addJavaScript
          path: output_path,
          sourcePath: input_path,
          data: output,
          bare: false

    return @
  
  return GenericCompiler
