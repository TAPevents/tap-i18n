path = Npm.require 'path'
fs = Npm.require 'fs'

HTTP.methods
  '/x/:lang':
    get: () ->
      try
        fs.readFileSync(path.join(process.env.TAP_I18N_DIR, "../../../public/x/", @params.lang), 'utf8')
      catch
        @setStatusCode(404) # Not found
