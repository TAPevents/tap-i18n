helpers = share.helpers
compilers = share.compilers
compilers.I18nJson = compilers.generic_compiler("json", helpers.loadJSON)
Plugin.registerCompiler
  extensions: ["i18n.json"]
, -> new compilers.I18nJson