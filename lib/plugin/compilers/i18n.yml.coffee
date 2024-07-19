helpers = share.helpers
compilers = share.compilers
compilers.I18nYml = compilers.generic_compiler "yml", helpers.loadYAML
Plugin.registerCompiler
  extensions: ["i18n.yml"]
, -> new compilers.I18nYml