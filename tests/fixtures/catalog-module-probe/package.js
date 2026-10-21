Package.describe({name: 'tap-i18n-tests:catalog-module-probe', version: '0.0.0'});
Package.onUse(function (api) {
  api.versionsFrom('2.2.4');
  api.use(['tap:i18n', 'ecmascript', 'tap-i18n-tests:catalog-probe']);
  api.addFiles(['imports/first.fr.i18n.json', 'imports/second.fr.i18n.yml'], ['client', 'server'], {lazy: true});
  api.mainModule('main.js', ['client', 'server']);
});
