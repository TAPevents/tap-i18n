_.extend share.TAPi18nClass.prototype,
  server_translators: null

  _registerServerTranslator: (lang_tag, package_name) ->
    if @_enabled()
      if not(lang_tag of @server_translators)
        @server_translators[lang_tag] = @_getSpecificLangTranslator(lang_tag)
        # Packages can supply translations before the project is enabled and
        # before it discovers this language. Load every pending namespace when
        # the language first becomes active, regardless of source file order.
        # The fallback language is already integrated, not in @translations.
        if lang_tag != @_fallback_language
          for own namespace, translations of @translations[lang_tag]
            @addResourceBundle(lang_tag, namespace, translations)
      else if lang_tag != @_fallback_language
        # Subsequent files update only the namespace they belong to.
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
      options = @_resolveLanguageOption(options)
      # Preserve exact translator keys, including package-only languages, and
      # retain the existing fallback for inputs outside the supported catalog.
      if lang_tag? and not (lang_tag of @server_translators)
        lang_tag = @getCanonicalLanguageTag(lang_tag) or lang_tag
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

    # Apply case-insensitivity only to tags, preserving the .json suffix and
    # query parsing. Both routes share the compiler's tag grammar.
    language_tag_regex = new RegExp "^(?:#{@language_tag_pattern})$", "i"
    resource_path_regex = /^([^?]+)\.json(?:\?.*)?$/
    multi_lang_route = "#{base_route}/multi/"
    WebApp.connectHandlers.use (req, res, next) ->
      if not req.url.startsWith(multi_lang_route)
        next()

        return

      langs = req.url.replace multi_lang_route, ""
      match = resource_path_regex.exec(langs)
      lang_tags = match?[1].split(",")
      if not match? or (match[1] isnt "all" and not _.every(lang_tags, (tag) -> language_tag_regex.test(tag)))
        res.writeHead 401
        res.end("tap:i18n: multi language route: couldn't process url: `#{req.url}'; Couldn't parse lang portion of route: `#{langs}'")
        return
      
      # If all lang is requested, return all.
      if match[1] is "all"
        res.writeHead 200, 
          "Content-Type": "application/json; charset=utf-8"
          "Access-Control-Allow-Origin": "*"
        res.end JSON.stringify self.translations, "utf8"
        return
      
      output = {}
      project_languages = self._getProjectLanguages()
      for lang_tag in lang_tags
        if lang_tag not in project_languages
          lang_tag = self.getCanonicalLanguageTag(lang_tag)
        if lang_tag in project_languages and lang_tag isnt self._fallback_language
          if (language_translations = self.translations[lang_tag])?
            output[lang_tag] = language_translations

      res.writeHead 200, 
        "Content-Type": "application/json; charset=utf-8"
        "Access-Control-Allow-Origin": "*"
      res.end JSON.stringify output, "utf8"

      return

    single_lang_route = "#{base_route}/"
    WebApp.connectHandlers.use (req, res, next) ->
      if not req.url.startsWith(single_lang_route)
        next()

        return

      lang = req.url.replace single_lang_route, ""
      match = resource_path_regex.exec(lang)
      lang_tag = match?[1]
      if not lang_tag? or not language_tag_regex.test(lang_tag)
        res.writeHead 401
        res.end("tap:i18n: single language route: couldn't process url: #{req.url}")
        return
      project_languages = self._getProjectLanguages()
      if lang_tag not in project_languages
        lang_tag = self.getCanonicalLanguageTag(lang_tag)

      if (lang_tag not in project_languages) or (lang_tag is self._fallback_language)
        res.writeHead 404
        res.end()
        return

      language_translations = self.translations[lang_tag] or {}
      # returning {} if lang_tag is not in translations allows the project
      # developer to force a language supporte with project-tap.i18n's
      # supported_languages property, even if that language has no lang
      # files.
      res.writeHead 200, 
        "Content-Type": "application/json; charset=utf-8"
        "Access-Control-Allow-Origin": "*"
      res.end JSON.stringify language_translations, "utf8"

      return
    
  _onceEnabled: ->
    @_registerAllServerTranslators()
