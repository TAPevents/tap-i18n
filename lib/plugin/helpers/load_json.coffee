fs = Npm.require 'fs'

# loads a json from file_path
#
# returns undefined if file doesn't exist null if file is empty, parsed content otherwise
_.extend share.helpers,
    loadJSON: (file_path) ->
      try # use try/catch to avoid the additional syscall to fs.existsSync
        fstats = fs.statSync file_path
      catch
        return undefined

      if fstats.size == 0
      	return null

      try
        content = JSON.parse(fs.readFileSync(file_path))
      catch error
        throw new Meteor.Error 500, "Can't load `#{file_path}' JSON",
          {file_path: file_path, error: error}
