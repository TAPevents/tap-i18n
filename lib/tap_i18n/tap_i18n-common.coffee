TAPi18n = {}

fallback_language = globals.fallback_language

_.extend TAPi18n,
  _loaded_languages: [fallback_language] # stores the loaded languages, the fallback language is loaded automatically

  _fallback_language: fallback_language

  _loaded_lang_session_key: "TAPi18n::loaded_lang"

  conf: null # If conf isn't null we assume that tap:i18n is enabled for the project.
             # We assume conf is valid, we sterilize and validate it during the build process.

  packages: {} # Stores the packages' package-tap.i18n jsons

  languages_available_for_project: {} # Stores languages that we've found languages files for in the project dir.
                                      # format:
                                      # {
                                      #    lang_tag: [lang_name_in_english, lang_name_in_local_language]
                                      # }

  translations: {} # Stores the packages/project translations - Server side only
                   # fallback_language translations are not stored here

  _enable: (conf) ->
    # tap:i18n gets enabled for a project once a conf file is set for it.
    # It can be either a conf object that was set by project-tap.i18n file or
    # a default conf, which is being added if the project has lang files
    # (*.i18n.json) but not project-tap.i18n
    @conf = conf

    @._onceEnabled()

  _onceEnabled: () ->
    # The arch specific code can use this for procedures that should be performed once
    # tap:i18n gets enabled (project conf file is being set)
    return

  _enabled: ->
    # read the comment of @conf
    @conf?

  _getPackageDomain: (package_name) ->
    package_name.replace(/:/g, "-")

  addResourceBundle: (lang_tag, package_name, translations) ->
    TAPi18next.addResourceBundle(lang_tag, TAPi18n._getPackageDomain(package_name), translations)

  _getProjectLanguages: () ->
    # Return an array of languages available for the current project
    if @._enabled()
      if _.isArray @.conf.supported_languages
        return _.union([@._fallback_language], @.conf.supported_languages)
      else
        # we know for certain that when tap-i18n is enabled the fallback lang is in @.languages_available_for_project
        return _.keys @.languages_available_for_project
    else
      return [@._fallback_language]

  getLanguages: ->
    if not @._enabled()
      return null

    languages = {}
    for lang_tag, desc of @.languages_available_for_project
      languages[lang_tag] =
        name: desc[1]
        en: desc[0]

    languages
