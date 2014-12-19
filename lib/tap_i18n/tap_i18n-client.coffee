loaded_lang_session_key = TAPi18n._loaded_lang_session_key

Session.set loaded_lang_session_key, null

_.extend TAPi18n,
  _getLanguageFilePath: (lang_tag) ->
    if not @_enabled()
      return null

    path = if @.conf.cdn_path? then @.conf.cdn_path else @.conf.i18n_files_route
    path = path.replace /\/$/, ""

    "#{path}/#{lang_tag}.json"

  _loadLanguage: (languageTag) ->
    # Load languageTag and its dependencies languages to TAPi18next if we
    # haven't loaded them already.
    #
    # languageTag dependencies languages are:
    # * The base language if languageTag is a dialect.
    # * The fallback language (en) if we haven't loaded it already.
    #
    # Returns a deferred object that resolves with no arguments if all files
    # loaded successfully to TAPi18next and rejects with array of error
    # messages otherwise
    #
    # Example:
    # TAPi18n._loadLanguage("pt-BR")
    #   .done(function () {
    #     console.log("languageLoaded successfully");
    #   })
    #   .fail(function (messages) {
    #     console.log("Couldn't load languageTag", messages);
    #   })
    #
    # The above example will attempt to load pt-BR, pt and en

    self = @

    dfd = new $.Deferred()

    if not @_enabled()
      return dfd.reject "tap-i18n is not enabled in the project level, check tap-i18n README"

    project_languages = self._getProjectLanguages()

    if languageTag in project_languages
      if languageTag not in self._loaded_languages
        loadLanguageTag = ->
          jqXHR = $.getJSON(self._getLanguageFilePath(languageTag))

          jqXHR.done (data) ->
            for package_name, package_keys of data
              TAPi18n.addResourceBundle(languageTag, package_name, package_keys)

            self._loaded_languages.push languageTag

            dfd.resolve()

          jqXHR.fail (xhr, error_code) ->
            dfd.reject("Couldn't load language '#{languageTag}' JSON: #{error_code}")

        directDependencyLanguageTag = if "-" in languageTag then languageTag.replace(/-.*/, "") else fallback_language

        # load dependency language if it is part of the project and not the fallback language
        if languageTag != fallback_language and directDependencyLanguageTag in project_languages
          dependencyLoadDfd = self._loadLanguage directDependencyLanguageTag

          dependencyLoadDfd.done ->
            # All dependencies loaded successfully
            loadLanguageTag()

          dependencyLoadDfd.fail (message) ->
            dfd.reject("Loading process failed since dependency language
              '#{directDependencyLanguageTag}' failed to load: " + message)
        else
          loadLanguageTag()
      else
        # languageTag loaded already
        dfd.resolve()
    else
      dfd.reject(["Language #{languageTag} is not supported"])

    return dfd.promise()

  _registerHelpers: (package_name, template) ->
    self = @

    if package_name != globals.project_translations_domain
      tapI18nextProxy = @_getPackageI18nextProxy(self.packages[package_name].namespace)
    else
      tapI18nextProxy = @_getPackageI18nextProxy(globals.project_translations_domain)

    underscore_helper = (key, args...) ->
      options = (args.pop()).hash
      if not _.isEmpty(args)
        options.sprintf = args

      tapI18nextProxy(key, options)

    # template specific helpers
    if package_name != globals.project_translations_domain
      # {{_ }}
      if Template[template]? and Template[template].helpers?
        helpers = {}
        helpers[self.packages[package_name].helper_name] = underscore_helper
        Template[template].helpers(helpers)

    # global helpers
    else
      # {{_ }}
      UI.registerHelper self.conf.helper_name, underscore_helper

      # {{languageTag}}
      UI.registerHelper "languageTag", () -> self.getLanguage()

  _getRegisterHelpersProxy: (package_name) ->
    # A proxy to _registerHelpers where the package_name is fixed to package_name
    self = @
    (template) ->
      self._registerHelpers(package_name, template)

  _getPackageI18nextProxy: (package_name) ->
    # A proxy to TAPi18next.t where the namespace is preset to the package's
    (key, options, lang_tag=null) ->
      if lang_tag?
        console.log "Warning: specifying lang_tag is not supported in client side, using session language"
      
      # If inside a reactive computation, we want to invalidate the computation if the client lang changes
      Session.get loaded_lang_session_key

      TAPi18next.t "#{TAPi18n._getPackageDomain(package_name)}:#{key}", options

  _onceEnabled: () ->
    TAPi18n._registerHelpers globals.project_translations_domain

  setLanguage: (lang_tag) ->
    @_loadLanguage(lang_tag).then ->
      TAPi18next.setLng(lang_tag)

      Session.set loaded_lang_session_key, lang_tag

  getLanguage: ->
    if not @._enabled()
      return null

    session_lang = Session.get loaded_lang_session_key

    if session_lang? then session_lang else @._fallback_language

TAPi18n.__ = TAPi18n._getPackageI18nextProxy(globals.project_translations_domain)
