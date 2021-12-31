Package.describe({
	name: 'rocketchat:tap-i18n',
	summary: 'A comprehensive internationalization solution for Meteor',
	version: '2.0.0',
	git: 'https://github.com/TAPevents/tap-i18n',
});

const both = ['server', 'client'];
const server = 'server';
const client = 'client';

Package.onUse(function(api) {
	api.versionsFrom('2.5');

	api.use('coffeescript', both);
	api.use('underscore', both);
	api.use('meteor', both);
	api.use('tracker', both);
	api.use('session', client);
	api.use('jquery', client);
	api.use('templating', client);

	api.use('raix:eventemitter@1.0.0', both);
	api.use('simple:json-routes', server);

	// load TAPi18n
	api.addFiles('lib/globals.js', both);

	// load and init TAPi18next
	api.addFiles('lib/tap_i18next/tap_i18next-1.7.3.js', both);
	api.export('TAPi18next');
	api.addFiles('lib/tap_i18next/tap_i18next_init.js', both);

	api.addFiles('lib/tap_i18n/tap_i18n-helpers.coffee', both);

	// We use the bare option since we need TAPi18n in the package level and
	// coffee adds vars to all (so without bare all vars are in the file level)
	api.addFiles('lib/tap_i18n/tap_i18n-common.coffee', server);
	api.addFiles('lib/tap_i18n/tap_i18n-common.coffee', client, { bare: true });

	api.addFiles('lib/tap_i18n/tap_i18n-server.coffee', server);
	api.addFiles('lib/tap_i18n/tap_i18n-client.coffee', client, { bare: true });

	api.addFiles('lib/tap_i18n/tap_i18n-init.coffee', server);
	api.addFiles('lib/tap_i18n/tap_i18n-init.coffee', client, { bare: true });

	api.export('TAPi18n');
});

Package.registerBuildPlugin({
	name: 'tap-i18n-compiler',
	use: ['coffeescript', 'underscore', 'mdg:validation-error@0.5.1', 'aldeed:simple-schema@1.5.4', 'check', 'templating'],
	npmDependencies: {
		yamljs: '0.3.0',
	},
	sources: [
		'lib/globals.js',

		'lib/plugin/etc/language_names.js',

		'lib/plugin/compiler_configuration.coffee',

		'lib/plugin/helpers/helpers.coffee',
		'lib/plugin/helpers/load_json.coffee',
		'lib/plugin/helpers/load_yml.coffee',
		'lib/plugin/helpers/compile_step_helpers.coffee',

		'lib/plugin/compilers/share.coffee',
		'lib/plugin/compilers/i18n.coffee',
		'lib/plugin/compilers/project-tap.i18n.coffee',
		'lib/plugin/compilers/package-tap.i18n.coffee',
		'lib/plugin/compilers/i18n.generic_compiler.coffee',
		'lib/plugin/compilers/i18n.json.coffee',
		'lib/plugin/compilers/i18n.yml.coffee',
	],
});
