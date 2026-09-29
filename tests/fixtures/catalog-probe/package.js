Package.describe({name: 'tap-i18n-tests:catalog-probe', version: '0.0.0'});
Package.onUse(function (api) {
  api.versionsFrom('2.2.4');
  api.use('tap:i18n');
  // Without package-tap.i18n these translations belong to the project. Read
  // the cache between generated files to exercise startup invalidation.
  api.addFiles(['before.js', 'en.i18n.json', 'between.js', 'fr.i18n.yml', 'after.js'], ['client', 'server']);
  api.export('catalogProbe');
});
