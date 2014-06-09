Package.on_use(function (api) {
  api.use(['tap-i18n'], ['client', 'server']);

  api.use(['coffeescript'], ['client']);

  api.add_files('lib/client.coffee', ['client']);
  api.add_files('lib/server.coffee', ['server']);

  api.add_files("package-tap.i18n", ['client', 'server']);

  api.add_files([
    "translations/en.i18n.json",
    "translations/cc.i18n.json",
    "translations/dd.i18n.json"
  ], ['client']);
});

