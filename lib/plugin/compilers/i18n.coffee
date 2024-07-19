path = Npm.require "path"

compilers = share.compilers

I18nConfCompiler = compilers.I18nConfCompiler = ->
  @processFilesForTarget = (input_files) ->
    input_files.forEach (input_file_obj) ->
      if input_file_obj.getBasename() is "package-tap.i18n"
        compilers.packageTapI18n input_file_obj

      if input_file_obj.getBasename() is "project-tap.i18n"
        compilers.projectTapI18n input_file_obj
      
      return
        
  return @

Plugin.registerCompiler 
  extensions: ["i18n"]
, -> new I18nConfCompiler