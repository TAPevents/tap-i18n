Package.on_use(function (api) {
  api.use(['tap-i18n'], ['client']);

  api.use(['templating'], ['client']);

  api.use(['coffeescript'], ['client', 'server']);

  // This must be loaded before any template
  api.add_files("package-tap.i18n", ['client']);

  api.add_files('lib/common.coffee', ['server', 'client']);
  api.add_files('lib/client.coffee', ['client']);

  api.add_files("index.html", ['client']);

  // These must be loaded after all templates
  api.add_files([
    "i18n/en.i18n.json",
    "i18n/bb.i18n.json",
    "i18n/cc.i18n.json",
    "i18n/cc-CC.i18n.json",
    "i18n/dd.i18n.json",
  ], ['client']);
});
