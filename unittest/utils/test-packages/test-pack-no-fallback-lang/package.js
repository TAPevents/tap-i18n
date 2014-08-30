Package.on_use(function (api) {
  api.use(['tap:i18n'], ['client', 'server']);

  api.use(['coffeescript'], ['client']);

  api.add_files("package-tap.i18n", ['client']);

  api.add_files([
    "translations/dd.i18n.json"
  ], ['client']);
});

