_.extend TAPi18n.prototype,
  server_translators: null

  _registerServerTranslator: (lang_tag, package_name) ->
    if @_enabled()
      if not(lang_tag of @server_translators)
        @server_translators[lang_tag] = @_getSpecificLangTranslator(lang_tag)

      # fallback language is integrated, and isn't part of @translations 
      if lang_tag != @_fallback_language
        @addResourceBundle(lang_tag, package_name, @translations[lang_tag][package_name])

    if not(@_fallback_language of @server_translators)
      @server_translators[@_fallback_language] = @_getSpecificLangTranslator(@_fallback_language)

  _registerAllServerTranslators: () ->
    for lang_tag in @_getProjectLanguages()
      for package_name of @translations[lang_tag]
        @_registerServerTranslator(lang_tag, package_name)

  _getPackageI18nextProxy: (package_name) ->
    # A proxy to TAPi18next.t where the namespace is preset to the package's
    (key, options, lang_tag=null) =>
      if not lang_tag?
        # translate to fallback_language
        return @server_translators[@_fallback_language] "#{@_getPackageDomain(package_name)}:#{key}", options
      else if not(lang_tag of @server_translators)
        console.log "Warning: language #{lang_tag} is not supported in this project, fallback language (#{@_fallback_language})"
        return @server_translators[@_fallback_language] "#{@_getPackageDomain(package_name)}:#{key}", options
      else
        return @server_translators[lang_tag] "#{@_getPackageDomain(package_name)}:#{key}", options

  _registerHTTPMethod: ->
    self = @

    methods = {}

    if not self._enabled()
      throw new Meteor.Error 500, "tap-i18n has to be enabled in order to register the HTTP method"
    
    base_route = "#{self.conf.i18n_files_route.replace(/\/$/, "")}"

    multi_lang_route = "#{base_route}/multi/"
    multi_lang_regex = new RegExp "^((#{globals.langauges_tags_regex},)*#{globals.langauges_tags_regex}|all)\\.json(\\?.*)?$"
    WebApp.connectHandlers.use (req, res, next) ->
      if not req.url.startsWith(multi_lang_route)
        next()

        return

      langs = req.url.replace multi_lang_route, ""
      if not multi_lang_regex.test langs
        res.writeHead 401
        res.end("tap:i18n: multi language route: couldn't process url: `#{req.url}'; Couldn't parse lang portion of route: `#{langs}'")
        return
      
      # If all lang is requested, return all.
      if (langs = langs.replace /\.json\??.*/, "", "") is "all"
        res.writeHead 200, 
          "Content-Type": "text/plain; charset=utf-8"
          "Access-Control-Allow-Origin": "*"
        res.end JSON.stringify self.translations, "utf8"
        return
      
      output = {}
      lang_tags = langs.split ","
      for lang_tag in lang_tags
        if lang_tag in self._getProjectLanguages() and lang_tag isnt self._fallback_language
          if (language_translations = self.translations[lang_tag])?
            output[lang_tag] = language_translations

      res.writeHead 200, 
        "Content-Type": "text/plain; charset=utf-8"
        "Access-Control-Allow-Origin": "*"
      res.end JSON.stringify output, "utf8"

      return

    single_lang_route = "#{base_route}/"
    single_lang_regex = new RegExp "^#{globals.langauges_tags_regex}.json(\\?.*)?$"
    WebApp.connectHandlers.use (req, res, next) ->
      if not req.url.startsWith(single_lang_route)
        next()

        return

      lang = req.url.replace single_lang_route, ""
      if not single_lang_regex.test lang
        res.writeHead 401
        res.end("tap:i18n: single language route: couldn't process url: #{req.url}")
        return
      lang_tag = lang.replace /\.json\??.*/, ""

      if (lang_tag not in self._getProjectLanguages()) or (lang_tag is self._fallback_language)
        res.writeHead 404
        res.end()
        return

      language_translations = self.translations[lang_tag] or {}
      # returning {} if lang_tag is not in translations allows the project
      # developer to force a language supporte with project-tap.i18n's
      # supported_languages property, even if that language has no lang
      # files.
      res.writeHead 200, 
        "Content-Type": "text/plain; charset=utf-8"
        "Access-Control-Allow-Origin": "*"
      res.end JSON.stringify language_translations, "utf8"

      return
    
  _onceEnabled: ->
    @_registerAllServerTranslators()