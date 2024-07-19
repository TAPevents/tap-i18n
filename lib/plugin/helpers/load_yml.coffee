YAML = Npm.require 'yamljs'
helpers = share.helpers

# loads a yml from input_file_obj
#
# returns undefined if file doesn't exist, null if file is empty, parsed content otherwise
_.extend share.helpers,
  loadYAML: (input_file_obj=null) ->
    if not input_file_obj?
      return undefined
      
    if not (content_as_string = input_file_obj.getContentsAsString())?
      return null

    try
      content = YAML.parse content_as_string
    catch error
      full_input_path = helpers.getFullInputPath input_file_obj
      input_file_obj.error
        message: "Can't load `#{full_input_path}' YAML",
        sourcePath: full_input_path

      throw new Error "Can't load `#{full_input_path}' YAML"
