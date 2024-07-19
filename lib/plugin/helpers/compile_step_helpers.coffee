path = Npm.require "path"

compiler_configuration = share.compiler_configuration

_.extend share.helpers,
    getCompileStepArchAndPackage: (input_file_obj) ->
      "#{input_file_obj.getPackageName()}:#{input_file_obj.getArch()}"

    markAsPackage: (input_file_obj) ->
      compiler_configuration.packages.push @getCompileStepArchAndPackage(input_file_obj)

    isPackage: (input_file_obj) ->
      @getCompileStepArchAndPackage(input_file_obj) in compiler_configuration.packages

    markProjectI18nLoaded: (input_file_obj) ->
      compiler_configuration.project_tap_i18n_loaded_for.push @getCompileStepArchAndPackage(input_file_obj)

    isProjectI18nLoaded: (input_file_obj) ->
      @getCompileStepArchAndPackage(input_file_obj) in compiler_configuration.project_tap_i18n_loaded_for

    markDefaultProjectConfInserted: (input_file_obj) ->
      compiler_configuration.default_project_conf_inserted_for.push @getCompileStepArchAndPackage(input_file_obj)

    isDefaultProjectConfInserted: (input_file_obj) ->
      @getCompileStepArchAndPackage(input_file_obj) in compiler_configuration.default_project_conf_inserted_for

    getFullInputPath: (input_file_obj) -> path.join input_file_obj.getSourceRoot(), input_file_obj.getPathInPackage()
    
    # archMatches is taken from https://github.com/meteor/meteor/blob/7da5b32d7882b510df8aa2002f891fc4e1ae1126/tools/utils/archinfo.ts#L232
    # due to lack of exposure of meteor/tools/utils/archinfo.ts.
    # If you find a way to use the original method, please use it and remove this one.
    archMatches: (input_file, program) ->
      input_file_arch = input_file.getArch()
      return input_file_arch.substr(0, program.length) is program and (input_file_arch.length is program.length or input_file_arch.substr(program.length, 1) is ".")