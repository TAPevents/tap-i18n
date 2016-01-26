share.package_i18n_schema = new SimpleSchema
  translation_function_name:
    type: String
    defaultValue: "__"
    label: "Translation Function Name"
    optional: true
  helper_name:
    type: String
    defaultValue: "_"
    label: "Helper Name"
    optional: true
  namespace:
    type: String
    defaultValue: null
    label: "Translations Namespace"
    optional: true


share.project_i18n_schema = schema = new SimpleSchema
  helper_name:
    type: String
    defaultValue: "_"
    label: "Helper Name"
    optional: true
  supported_languages:
    type: [String]
    label: "Supported Languages"
    defaultValue: null
    optional: true
  i18n_files_route:
    type: String
    label: "Unified languages files path"
    defaultValue: globals.browser_path
    optional: true
  preloaded_langs:
    type: [String]
    label: "Preload languages"
    defaultValue: []
    optional: true
  cdn_path:
    type: String
    label: "Unified languages files path on CDN"
    defaultValue: null
    optional: true

share.getProjectConfJs = (conf) ->
  fallback_language_name = language_names[globals.fallback_language]

  project_conf_js = """
    TAPi18n._enable(#{JSON.stringify(conf)});
    TAPi18n.languages_names["#{globals.fallback_language}"] = #{JSON.stringify fallback_language_name};

  """

  # If we get a list of supported languages we must make sure that we'll have a
  # language name for each one of its languages.
  #
  # Though languages names are added for every language we find i18n.json file
  # for (by the i18n.json compiler). We shouldn't rely on the existence of
  # *.i18n.json file for each supported language, because a language might be
  # defined as supported even when it has no i18n.json files (it's especially
  # true when tap:i18n is used with tap:i18n-db)
  if conf.supported_languages?
    for lang_tag in conf.supported_languages
      if language_names[lang_tag]?
        project_conf_js += """
          TAPi18n.languages_names["#{lang_tag}"] = #{JSON.stringify language_names[lang_tag]};

        """

  return project_conf_js
