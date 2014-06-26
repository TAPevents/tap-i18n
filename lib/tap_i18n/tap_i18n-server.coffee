path = Npm.require 'path'
fs = Npm.require 'fs'

# server_dir = if process.env.TAP_I18N_DIR then else process.env.SERVER_DIR
tap_i18n_default_build_files_path = null
if process.env.TAP_I18N_DIR?
  tap_i18n_default_build_files_path = process.env.TAP_I18N_DIR
else
  if (__meteor_bootstrap__ && __meteor_bootstrap__.serverDir)
    tap_i18n_default_build_files_path = path.join(__meteor_bootstrap__.serverDir, '../../../tap-i18n/')

  if (!fs.existsSync(tap_i18n_default_build_files_path))
    tap_i18n_default_build_files_path = path.join(__meteor_bootstrap__.serverDir, '../../tap-i18n/')

  if (!fs.existsSync(tap_i18n_default_build_files_path))
    tap_i18n_default_build_files_path = null

_.extend TAPi18n,
  registerHTTPMethod: ->
    methods = {}

    methods["#{globals.default_browser_path}/:lang"] =
      get: () ->
        if RegExp("^#{globals.langauges_tags_regex}.json$").test(@params.lang)
          try
            fs.readFileSync(path.join(tap_i18n_default_build_files_path, @params.lang), 'utf8')
          catch
            @setStatusCode(404) # Not found
        else
          @setStatusCode(401) # Unauthorized

    HTTP.methods methods

    TAPi18n.conf.browser_path = globals.default_browser_path

Meteor.startup ->
  # If tap-i18n is enabled for that project
  if TAPi18n.conf?
    # If build files path is null we use the default build files path and
    # initiate the integral unified languages files access point 
    if TAPi18n.conf.build_files_path == null and tap_i18n_default_build_files_path?
      TAPi18n.registerHTTPMethod()
