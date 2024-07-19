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

