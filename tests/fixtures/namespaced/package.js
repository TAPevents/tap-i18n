Package.describe({name: 'tap-i18n-tests:namespaced', version: '0.0.0'});
Package.onUse(function (api) {
  api.versionsFrom('2.2.4');
  api.use(['tap:i18n', 'templating']);
  // This configuration deliberately comes BEFORE the template and translations.
  api.addFiles('package-tap.i18n', ['client', 'server']);
  api.addFiles('template.html', 'client');
  api.addFiles(['en.i18n.json', 'cc.i18n.yml', 'zz.i18n.json'], ['client', 'server']);
  api.export('translateFixture');
});
