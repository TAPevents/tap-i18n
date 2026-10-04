const {expect} = require('chai');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const coffee = require('coffeescript');

const source = path.resolve(__dirname, '../..');

function createCompiler() {
  const registrations = [];
  const context = vm.createContext({
    share: {}, console, _: require('underscore'), Npm: {require},
    // Valid-schema fixtures only. Meteor's real check() and schema rejection
    // are exercised by the full-app scenarios, not this InputFile adapter.
    check() {},
    Plugin: {registerCompiler(options, factory) { registrations.push({options, factory}); }}
  });
  let sources;
  vm.runInNewContext(fs.readFileSync(path.join(source, 'package.js'), 'utf8'), {
    Package: {describe() {}, onUse() {}, onTest() {}, registerBuildPlugin(config) { sources = config.sources; }}
  });
  for (const file of sources) {
    let code = fs.readFileSync(path.join(source, file), 'utf8');
    if (file.endsWith('.coffee')) code = coffee.compile(code);
    vm.runInContext(code, context, {filename: file});
  }
  expect(registrations).to.have.length(1);
  return registrations[0].factory();
}

function input(name, pkg = 'fixture', arch = 'web.browser', contents = '{}') {
  const output = [];
  return {
    output,
    getSourceRoot: () => '/fixtures/' + (pkg || 'app'),
    getPathInPackage: () => name,
    getBasename: () => path.basename(name),
    getPackageName: () => pkg,
    getArch: () => arch,
    getExtension: () => name.endsWith('.i18n.json') ? 'i18n.json' : name.endsWith('.i18n.yml') ? 'i18n.yml' : 'i18n',
    getContentsAsString: () => contents,
    addJavaScript: data => output.push(data.data),
    error: error => { throw new Error(error.message); }
  };
}

function code(file) { return file.output.join('\n'); }

describe('TAPi18n compiler - batch lifecycle', function () {
  let compiler;
  beforeEach(function () { compiler = createCompiler(); });
  const compile = files => compiler.processFilesForTarget(files);

  it('resolves cross-package configuration and registers templates once with YAML first', function () {
    const project = input('en.i18n.json', null);
    const config = input('package-tap.i18n');
    const yaml = input('first.en.i18n.yml', 'fixture', 'web.browser', 'key: first');
    const json = input('last.en.i18n.json');
    compile([project, config, yaml, json]);
    expect(code(project)).to.include('package_name = "project"');
    expect(code(yaml)).to.include('package_name = "fixture"').and.include('var package_templates');
    expect(code(json)).not.to.include('var package_templates');
    expect(code(yaml) + code(json)).not.to.include('TAPi18n._enable');
  });

  it('resets the same target even when the next build shares no input paths', function () {
    compile([input('package-tap.i18n'), input('en.i18n.yml', 'fixture', 'web.browser', 'key: value')]);
    const next = input('different.fr.i18n.json');
    compile([next]);
    expect(code(next)).to.include('package_name = "project"').and.include('TAPi18n._enable');
    expect(code(next)).not.to.include('var package_templates');
  });

  it('isolates repeated server, browser, legacy and Cordova targets', function () {
    for (const arch of ['os.osx.arm64', 'web.browser', 'web.browser', 'web.browser.legacy', 'web.cordova']) {
      const cfg = input('nested/package-tap.i18n', 'fixture', arch);
      const lang = input('nested/en.i18n.json', 'fixture', arch);
      compile([cfg, lang]);
      expect(code(lang)).to.include('package_name = "fixture"');
      expect(code(lang).includes('var package_templates')).to.equal(arch.startsWith('web'));
      expect(code(lang).includes('_registerServerTranslator')).to.equal(arch.startsWith('os'));
    }
  });

  it('discovers explicit project configuration even after a translation input', function () {
    const lang = input('i18n/en.i18n.json', null);
    const cfg = input('project-tap.i18n', null);
    compile([lang, cfg]);
    expect(code(lang)).not.to.include('TAPi18n._enable');
    expect(code(cfg)).to.include('TAPi18n._enable');
  });

  it('rejects late or duplicate package configuration and recovers on the next batch', function () {
    expect(() => compile([input('en.i18n.yml', 'late', 'web.browser', 'key: value'), input('package-tap.i18n', 'late')])).to.throw('should be loaded before');
    expect(() => compile([input('package-tap.i18n'), input('nested/package-tap.i18n')])).to.throw('More than one package-tap');
    const recovered = input('after-error.en.i18n.json');
    compile([recovered]);
    expect(code(recovered)).to.include('package_name = "project"').and.include('TAPi18n._enable');
  });

  it('rejects conflicting project configuration and handles an empty batch', function () {
    expect(() => compile([input('project-tap.i18n', null), input('nested/project-tap.i18n', null)])).to.throw('more than one project-tap');
    expect(() => compile([input('project-tap.i18n'), input('package-tap.i18n')])).to.throw('project-tap.i18n is present');
    expect(() => compile([input('package-tap.i18n'), input('project-tap.i18n')])).to.throw("Can't load project-tap.i18n in a package");
    compile([]);
    const next = input('en.i18n.json', null);
    compile([next]);
    expect(code(next)).to.include('TAPi18n._enable');
  });
});


describe('TAPi18n compiler - language names', function () {
  const expectedNames = {
    'en-US': ['English (United States)', 'English (United States)'],
    fr: ['French', 'Français'],
    'fr-BE': ['French (Belgium)', 'Français (Belgique)'],
    'fr-CA': ['French (Canada)', 'Français (Canada)'],
    'fr-FR': ['French (France)', 'Français (France)']
  };

  function registeredNames(files) {
    createCompiler().processFilesForTarget(files);
    // Execute the compiler output with registration sinks. This checks the
    // metadata supplied to the runtime, rather than reading the source table.
    const TAPi18n = {
      languages_names: {}, translations: {},
      _enable() {}, invalidateLanguagesCache() {}, _registerServerTranslator() {}
    };
    const underscore = require('underscore');
    const context = vm.createContext({TAPi18n, _: underscore, Package: {underscore: {_: underscore}}});
    for (const file of files) vm.runInContext(code(file), context);
    return TAPi18n.languages_names;
  }

  for (const arch of ['web.browser', 'os.osx.arm64']) {
    it('registers friendly names from translation files on ' + arch, function () {
      const files = Object.keys(expectedNames).map(tag => input(tag + '.i18n.json', null, arch));
      expect(registeredNames(files)).to.deep.equal({en: ['English', 'English'], ...expectedNames});
    });

    it('registers configured names without translation files on ' + arch, function () {
      const config = input('project-tap.i18n', null, arch,
        JSON.stringify({supported_languages: Object.keys(expectedNames)}));
      expect(registeredNames([config])).to.deep.equal({en: ['English', 'English'], ...expectedNames});
    });
  }

  it('keeps generic French distinct without adding regional languages', function () {
    const config = input('project-tap.i18n', null, 'web.browser',
      JSON.stringify({supported_languages: ['fr']}));
    expect(registeredNames([config])).to.deep.equal({
      en: ['English', 'English'], fr: ['French', 'Français']
    });
  });
});


describe('TAPi18n compiler - shared language tag grammar', function () {
  for (const extension of ['json', 'yml']) {
    for (const arch of ['web.browser', 'os.osx.arm64']) {
      it('accepts the bounded tag forms in ' + extension + ' on ' + arch, function () {
        for (const tag of ['en', 'pt-BR', 'hmn', 'hmn-US', 'es-419', 'hmn-419']) {
          const file = input(tag + '.i18n.' + extension, null, arch, extension === 'json' ? '{}' : 'message: fixture');
          expect(() => createCompiler().processFilesForTarget([file]), tag).not.to.throw();
          expect(code(file), tag).to.include('TAPi18n.languages_names["' + tag + '"]');
        }
      });
    }
    it('rejects filename casing and shapes outside the subset in ' + extension, function () {
      for (const tag of ['HMN', 'hmn-us', 'ES-419', 'e', 'abcd', 'en-USA', 'es-41', 'es-4199', 'zh-Hant', 'zh-Hant-TW', 'sl-rozaj', 'es_419']) {
        const file = input(tag + '.i18n.' + extension, null, 'web.browser', extension === 'json' ? '{}' : 'message: fixture');
        expect(() => createCompiler().processFilesForTarget([file]), tag).to.throw("Can't recognise '" + tag + "' as a language-tag");
      }
    });
  }

  function preload(runtimeTags, projectTags) {
    const file = input('project-tap.i18n', null, 'web.browser', JSON.stringify({preloaded_langs: projectTags}));
    createCompiler().processFilesForTarget([file]);
    const requests = [], errors = [];
    const context = vm.createContext({share: {}});
    vm.runInContext(coffee.compile(fs.readFileSync(path.join(source, 'lib/static.coffee'), 'utf8')), context);
    Object.assign(context, {
      TAP_I18N_PRELOADED_LANGS: runtimeTags, _: require('underscore'),
      console: {error: message => errors.push(message)},
      TAPi18n: {...context.share.constants, languages_names: {}, _enable() {}, invalidateLanguagesCache() {}, _cdn: url => url},
      $: {ajax: options => requests.push(options.url)}
    });
    vm.runInContext(code(file), context);
    return {requests, errors};
  }

  it('uses runtime casing and the same tag grammar in generated preloading code', function () {
    expect(preload(['ES-419', 'HMN-us'], ['hmn'])).to.deep.equal({
      requests: ['/tap-i18n/multi/ES-419,HMN-us,hmn.json'], errors: []
    });
  });

  it('preloads configured tags without a usable runtime list', function () {
    for (const runtimeTags of [undefined, null, [], ['zh-Hant']]) {
      const result = preload(runtimeTags, ['hmn-US']);
      expect(result.requests).to.deep.equal(['/tap-i18n/multi/hmn-US.json']);
      expect(result.errors).to.have.length(Array.isArray(runtimeTags) && runtimeTags.length ? 1 : 0);
    }
    expect(preload(undefined, []).requests).to.deep.equal([]);
    expect(preload(undefined, ['*']).requests).to.deep.equal(['/tap-i18n/multi/all.json']);
  });

  it('rejects invalid runtime preload entries without throwing or requesting resources', function () {
    for (const tags of [[null], [42], ['zh-Hant'], ['en-USA'], ['es-41'], ['es-419/path'], 'hmn']) {
      const result = preload(tags, []);
      expect(result.requests).to.deep.equal([]);
      expect(result.errors).to.have.length(1);
    }
  });
});
