JSON.minify = JSON.minify || Npm.require("node-json-minify")
helpers = share.helpers

# loads a json from input_file_obj
#
# returns undefined if file doesn't exist, null if file is empty, parsed content otherwise
_.extend share.helpers,
  loadJSON: (input_file_obj) ->
    if not input_file_obj?
      return undefined
      
    if not (content_as_string = input_file_obj.getContentsAsString())?
      return null

    try
      content = JSON.parse content_as_string
    catch error
      full_input_path = helpers.getFullInputPath input_file_obj
      input_file_obj.error
        message: "Can't load `#{full_input_path}' JSON",
        sourcePath: full_input_path

      throw new Error "Can't load `#{full_input_path}' JSON"
