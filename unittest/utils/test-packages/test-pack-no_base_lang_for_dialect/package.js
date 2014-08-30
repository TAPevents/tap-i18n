Package.on_use(function (api) {
  api.use(['tap:i18n'], ['client', 'server']);

  api.use(['coffeescript'], ['client']);

  api.add_files("package-tap.i18n", ['client']);

  api.add_files([
    "translations/en.i18n.json",
    "translations/cc-CC.i18n.json"
  ], ['client']);
});

