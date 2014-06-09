TAPi18n = {}

_.extend TAPi18n,
  conf: null # This parameter will be set by the js that is being added by the
             # build plugin of project-tap.i18n.
             # if it isn't null we assume that it is valid (we clean and
             # validate it thoroughly during the build process)

  _enabled: ->
    # read the comment of @conf
    @conf?

