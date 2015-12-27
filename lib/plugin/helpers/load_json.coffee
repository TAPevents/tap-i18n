JSON.minify = JSON.minify || Npm.require("node-json-minify")

# loads a json from file_path
#
# returns null if file is empty, parsed content otherwise
_.extend share.helpers,
    loadJSON: (inputFile) ->
      try
        fileContent = inputFile.getContentsAsString()
        if fileContent.length == 0
          res = null
        else
          res = JSON.parse(JSON.minify(fileContent))
      catch error
        inputFile.error
          message: "Can't load `#{inputFile.getDisplayPath()}' JSON"

      return res
