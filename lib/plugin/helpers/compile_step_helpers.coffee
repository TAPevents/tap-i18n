compiler_configuration = share.compiler_configuration

_.extend share.helpers,
    getCompileStepArchAndPackage: (inputFile) ->
      "#{inputFile.getPackageName()}:#{inputFile.getArch()}"

    markAsPackage: (compileStep) ->
      compiler_configuration.packages.push @.getCompileStepArchAndPackage(compileStep)

    isPackage: (inputFile) ->
      inputFile.getPackageName() != null

    markProjectI18nLoaded: (compileStep) ->
      compiler_configuration.project_tap_i18n_loaded_for.push @.getCompileStepArchAndPackage(compileStep)

    isProjectI18nLoaded: (compileStep) ->
      @.getCompileStepArchAndPackage(compileStep) in compiler_configuration.project_tap_i18n_loaded_for

    markDefaultProjectConfInserted: (compileStep) ->
      compiler_configuration.default_project_conf_inserted_for.push @.getCompileStepArchAndPackage(compileStep)

    isDefaultProjectConfInserted: (compileStep) ->
      @.getCompileStepArchAndPackage(compileStep) in compiler_configuration.default_project_conf_inserted_for
