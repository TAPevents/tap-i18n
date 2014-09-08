_.extend TAPi18n,
  server_translators: {}

  _registerServerTranslators: () ->
    self = @

    if self._enabled()
      for lang_tag in self._getProjectLanguages()
        do (lang_tag) ->
          for package_name of self.translations[lang_tag]
            TAPi18n.addResourceBundle(lang_tag, package_name, self.translations[lang_tag][package_name]);

          TAPi18next.setLng lang_tag, {fixLng: true}, (lang_translator) ->
            self.server_translators[lang_tag] = lang_translator
    else
      TAPi18next.setLng self._fallback_language, {fixLng: true}, (lang_translator) ->
        self.server_translators[self._fallback_language] = lang_translator

  _getPackageI18nextProxy: (package_name) ->
    self = @
    # A proxy to TAPi18next.t where the namespace is preset to the package's
    (key, options, lang_tag=null) ->
      if not lang_tag?
        # translate to fallback_language
        return self.server_translators[self._fallback_language] "#{TAPi18n._getPackageDomain(package_name)}:#{key}", options
      else if not(lang_tag of self.server_translators)
        console.log "Warning: language #{lang_tag} is not supported in this project, fallback language (#{self._fallback_language})"
        return self.server_translators[self._fallback_language] "#{TAPi18n._getPackageDomain(package_name)}:#{key}", options
      else
        return self.server_translators[lang_tag] "#{TAPi18n._getPackageDomain(package_name)}:#{key}", options

  _registerHTTPMethod: ->
    self = @

    methods = {}

    if not self._enabled()
      throw new Meteor.Error 500, "tap-i18n has to be enabled in order to register the HTTP method"

    methods["#{TAPi18n.conf.i18n_files_route.replace(/\/$/, "")}/:lang"] =
      get: () ->
        if not RegExp("^#{globals.langauges_tags_regex}.json$").test(@params.lang)
          return @setStatusCode(401)

        lang_tag = @params.lang.replace ".json", ""

        if lang_tag not in self._getProjectLanguages() or \
           lang_tag == self._fallback_language # fallback language is integrated to the bundle
          return @setStatusCode(404) # not found

        return JSON.stringify self.translations[lang_tag]

    HTTP.methods methods

TAPi18n.__ = TAPi18n._getPackageI18nextProxy(globals.project_translations_domain)

Meteor.startup ->
  TAPi18n._registerServerTranslators()

  # If tap-i18n is enabled for that project
  if TAPi18n._enabled()
    TAPi18n._registerHTTPMethod()
