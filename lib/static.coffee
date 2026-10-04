# Loaded by both the build plugin and the runtime. The constructor exposes these
# same primitive values as read-only properties on the exported TAPi18n instance.
# The unanchored pattern describes the supported subset of BCP 47, not registry
# membership. Filenames use this casing; runtime input uses the "i" regex flag.
share.constants = Object.freeze
  language_tag_pattern: "[a-z]{2,3}(?:-(?:[A-Z]{2}|[0-9]{3}))?"
  fallback_language: "en"
  project_translations_domain: "project"
  default_i18n_files_route: "/tap-i18n"
