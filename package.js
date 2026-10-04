Package.describe({
  name: 'tap:i18n',
  summary: 'A comprehensive internationalization solution for Meteor',
  version: '2.3.0',
  git: 'https://github.com/TAPevents/tap-i18n'
});

both = ['server', 'client'];
server = 'server';
client = 'client';

Package.onUse(function (api) {
  api.versionsFrom("2.2.4");

  api.use('coffeescript@2.4.1', both);
  api.use('underscore@1.0.10', both);
  api.use('isobuild:compiler-plugin@1.0.0', both);

  api.use('raix:eventemitter@0.1.1', both);
  api.use('meteorspark:util@0.2.0', both);

  api.use('tracker', both);
  api.use('session', client);
  api.use('jquery@1.0.10', client);
  api.use('templating@1.4.0', client);

  api.use("webapp", server);

  // load TAPi18n
  api.addFiles('lib/static.coffee', both);

  // load and init TAPi18next
  api.addFiles('lib/tap_i18next/tap_i18next-1.7.3.js', both);
  api.export('TAPi18next');
  api.addFiles('lib/tap_i18next/tap_i18next_init.coffee', both);

  api.addFiles('lib/tap_i18n/tap_i18n-helpers.coffee', both);

  // share.TAPi18nClass keeps the constructor private across CoffeeScript files.
  // Build its prototype before creating the exported TAPi18n singleton below.
  api.addFiles('lib/tap_i18n/tap_i18n-common.coffee', server);
  api.addFiles('lib/tap_i18n/tap_i18n-common.coffee', client, {bare: true});

  api.addFiles('lib/tap_i18n/tap_i18n-server.coffee', server);
  api.addFiles('lib/tap_i18n/tap_i18n-client.coffee', client, {bare: true});

  api.addFiles('lib/tap_i18n/tap_i18n-init.coffee', server);
  api.addFiles('lib/tap_i18n/tap_i18n-init.coffee', client, {bare: true});

  api.export('TAPi18n');
});

// Test-only dependencies and files. From this checkout, run:
//   npm ci --prefix tests
//   npm test --prefix tests
// The runner builds isolated fixture apps and executes Mocha/Chai on both
// the real Meteor server and headless Chrome. See README.md, Unit Testing.
Package.onTest(function (api) {
  api.versionsFrom('2.2.4');
  api.use(['tap:i18n', 'ecmascript', 'meteortesting:mocha@=3.2.0', 'tracker'], both);
  api.use(['jquery', 'templating', 'blaze'], client);
  api.addFiles('tests/mocha/both/api.app-test.js', both);
  api.addFiles('tests/mocha/both/fixed-translator.app-test.js', both);
  api.addFiles('tests/mocha/both/plural-rules.app-test.js', both);
  api.addFiles('tests/mocha/both/catalog-cache.app-test.js', both);
  api.addFiles('tests/mocha/both/language-tags.app-test.js', both);
  api.addFiles('tests/mocha/both/catalog-initialization.app-test.js', both);
  api.addFiles('tests/mocha/both/catalog-benchmark.app-test.js', both);
  api.addFiles('tests/mocha/server/translations.app-test.js', server);
  api.addFiles('tests/mocha/server/initialization.app-test.js', server);
  api.addFiles('tests/mocha/client/reactivity.app-test.js', client);
  api.addFiles('tests/mocha/client/catalog-cache.app-test.js', client);
  api.addFiles('tests/mocha/client/language-tags.app-test.js', client);
});

Package.registerBuildPlugin({
  name: 'tap-i18n-compiler',
  use: ['coffeescript@2.4.1', 'underscore@1.0.10', 'check@1.3.1'],
  npmDependencies: {
    "node-json-minify": "0.1.3-a",
    "yamljs": "0.2.4"
  },
  sources: [
    'lib/static.coffee',

    'lib/plugin/etc/language_names.js',

    'lib/plugin/compiler_configuration.coffee',

    'lib/plugin/helpers/helpers.coffee',
    'lib/plugin/helpers/load_json.coffee',
    'lib/plugin/helpers/load_yml.coffee',
    'lib/plugin/helpers/compile_step_helpers.coffee',
    'lib/plugin/helpers/schema-cleaner.coffee',

    'lib/plugin/compilers/share.coffee',
    'lib/plugin/compilers/i18n.coffee',
    'lib/plugin/compilers/project-tap.i18n.coffee',
    'lib/plugin/compilers/package-tap.i18n.coffee',
    'lib/plugin/compilers/i18n.generic_compiler.coffee',
    'lib/plugin/compilers/i18n.json.coffee',
    'lib/plugin/compilers/i18n.yml.coffee'
  ]
});
