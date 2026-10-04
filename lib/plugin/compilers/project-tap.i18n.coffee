helpers = share.helpers
compilers = share.compilers

project_i18n_obj_schema =
  helper_name:
    type: String
    defaultValue: "_"
    label: "Helper Name"
  supported_languages:
    type: [String]
    label: "Supported Languages"
    defaultValue: null
  i18n_files_route:
    type: String
    label: "Unified languages files path"
    defaultValue: share.constants.default_i18n_files_route
  preloaded_langs:
    type: [String]
    label: "Preload languages"
    defaultValue: []
  'preloaded_langs.$':
    type: String
  cdn_path:
    type: String
    label: "[OBSOLETE] Unified languages files path on CDN"
    defaultValue: null

share.projectI18nObjCleaner = projectI18nObjCleaner = helpers.buildCleanerForSchema(project_i18n_obj_schema, "project-tap.i18n")

getProjectConfJs = share.getProjectConfJs = (conf) ->
  fallback_language_name = language_names[share.constants.fallback_language]

  project_conf_js = """
    TAPi18n._enable(#{JSON.stringify(conf)});
    TAPi18n.languages_names["#{share.constants.fallback_language}"] = #{JSON.stringify fallback_language_name};

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

  # Configuration can supply names without a corresponding translation file.
  # Invalidate after those writes, including a catalog read during _enable().
  project_conf_js += "TAPi18n.invalidateLanguagesCache();\n"

  return project_conf_js

compilers.projectTapI18n = (input_file_obj) ->
  input_path = helpers.getFullInputPath input_file_obj

  if helpers.isPackage input_file_obj
    input_file_obj.error
      message: "Can't load project-tap.i18n in a package: #{input_file_obj.packageName}",
      sourcePath: input_path
    return

  if helpers.isProjectI18nLoaded input_file_obj
    input_file_obj.error
      message: "Can't have more than one project-tap.i18n",
      sourcePath: input_path
    return

  project_tap_i18n = helpers.loadJSON input_file_obj

  if not project_tap_i18n?
    project_tap_i18n = projectI18nObjCleaner({})
  else
    projectI18nObjCleaner project_tap_i18n

  if project_tap_i18n.cdn_path?
    console.warn "As of version v1.11.0 of tap:i18n we no longer support the cdn_path option in project.tap.i18n please refer to our README on: https://github.com/TAPevents/tap-i18n to learn how to setup your CDN"

  project_i18n_js_file = getProjectConfJs project_tap_i18n

  if helpers.archMatches input_file_obj, "web"
    preloaded_langs = ["all"]
    if project_tap_i18n.preloaded_langs[0] != "*"
      preloaded_langs = project_tap_i18n.preloaded_langs

    project_i18n_js_file += """
      var project_preloaded_langs = #{JSON.stringify preloaded_langs};

      // Match the same runtime tag syntax as the HTTP resource endpoints.
      var runtime_preloaded_langs = [];

      if (typeof TAP_I18N_PRELOADED_LANGS !== "undefined" && TAP_I18N_PRELOADED_LANGS !== null) {
        if (!_.isArray(TAP_I18N_PRELOADED_LANGS)) {
          console.error("tap-i18n: An invalid TAP_I18N_PRELOADED_LANGS encountered, skipping.");
        } else {
          var language_tag_regex = new RegExp("^(?:" + TAPi18n.language_tag_pattern + ")$", "i");
          var is_runtime_preloaded_langs_valid = _.every(TAP_I18N_PRELOADED_LANGS, function(lang_tag) {
            return _.isString(lang_tag) && language_tag_regex.test(lang_tag);
          });
          if (!is_runtime_preloaded_langs_valid) {
            console.error("tap-i18n: An invalid TAP_I18N_PRELOADED_LANGS encountered, skipping.");
          } else {
            runtime_preloaded_langs = TAP_I18N_PRELOADED_LANGS;
          }
        }
      }

      var preloaded_langs = [];
      if (project_preloaded_langs[0] === "all") {
        preloaded_langs = ["all"]
      }
      else {
        preloaded_langs = _.union(project_preloaded_langs, runtime_preloaded_langs);
      }

      preloaded_langs.sort()

      if (!_.isEmpty(preloaded_langs)) {
        $.ajax({
            type: 'GET',
            url: TAPi18n._cdn(`#{project_tap_i18n.i18n_files_route}/multi/${preloaded_langs.join(",")}.json`),
            dataType: 'json',
            success: function(data) {
              for (lang_tag in data) {
                TAPi18n._loadLangFileObject(lang_tag, data[lang_tag]);
                TAPi18n._loaded_languages.push(lang_tag);
              }
            },
            data: {},
            async: false
        });
      }
    """

  helpers.markProjectI18nLoaded(input_file_obj)

  return input_file_obj.addJavaScript
    path: "project-i18n.js",
    sourcePath: input_path,
    data: project_i18n_js_file,
    bare: false
