helpers = share.helpers
compilers = share.compilers
compiler_configuration = share.compiler_configuration

I18nCompiler = ->
  json_compiler = new compilers.I18nJson
  yml_compiler = new compilers.I18nYml

  @processFilesForTarget = (input_files) ->
    compiler_configuration.reset()
    translations_seen = Object.create(null)

    # Meteor groups files by compiler across packages. Register all extensions
    # together so configuration is known before any translations are compiled.
    input_files.forEach (input_file_obj) ->
      package_arch = helpers.getCompileStepArchAndPackage(input_file_obj)
      if input_file_obj.getExtension() isnt "i18n"
        translations_seen[package_arch] = true
        return

      switch input_file_obj.getBasename()
        when "package-tap.i18n"
          # Generated files still execute in api.addFiles order. Keep rejecting
          # packages that declare their configuration after their translations.
          if translations_seen[package_arch]
            input_file_obj.error
              message: "package-tap.i18n should be loaded before languages files (*.i18n.json)",
              sourcePath: helpers.getFullInputPath(input_file_obj)
            return
          compilers.packageTapI18n input_file_obj
        when "project-tap.i18n"
          compilers.projectTapI18n input_file_obj
      return

    # Preserve the original order across JSON and YAML, including which file
    # initializes project defaults or registers a package's template helpers.
    # addJavaScript attaches output to its input file's original resource slot.
    input_files.forEach (input_file_obj) ->
      switch input_file_obj.getExtension()
        when "i18n.json" then json_compiler.processFilesForTarget([input_file_obj])
        when "i18n.yml" then yml_compiler.processFilesForTarget([input_file_obj])
      return
    return

  return @

Plugin.registerCompiler
  extensions: ["i18n", "i18n.json", "i18n.yml"]
, -> new I18nCompiler
