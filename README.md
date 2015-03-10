# tap-i18n

A comprehensive internationalization solution for Meteor

### Internationalization for Meteor

**tap-i18n** is a [Meteor](http://www.meteor.com) package that provides a comprehensive [i18n](http://www.i18nguy.com/origini18n.html) solution for Meteor apps and packages, with the goal of standardizing the way package developers internationalize their
packages.

[Watch a talk about tap:i18n & tap:i18n-db](https://www.youtube.com/watch?v=cu_dsoIc_0E)

**Developed by:** <a href="http://www.meteorspark.com"><img src="http://www.meteorspark.com/logo/logo-github.png" title="MeteorSpark" alt="MeteorSpark"></a> [Professional Meteor Services](http://www.meteorspark.com) for [TAPevents](http://tapevents.com/).

**Maintained by:** JustDo.com [Project Management Tool](https://justdo.com).

**Related Packages:**

* Check [tap:i18n-db](https://github.com/TAPevents/tap-i18n-db) for Meteor collections internationalization.
* Check [tap:i18n-ui](https://github.com/TAPevents/tap-i18n-ui) for bootstrap based UI components for tap:i18n.
* Check [tap:i18n-bundler](https://github.com/TAPevents/i18n-bundler) for Cordova & static file deployments.

## Contents

- [Key Features](#key-features)
- [Quickstart](#quickstart)
- [Documentation & Examples](#documentation--examples)
    - [TAPi18n API](#tapi18n-api)
    - [The tap-i18n Helpers](#the-tap-i18n-helpers)
    - [Languages Tags and Translations Prioritization](#languages-tags-and-translations-prioritization)
    - [Structure of Languages Files](#structure-of-languages-files)
    - [Configuring tap-i18n](#configuring-tap-i18n)
    - [Configuring CDN in tap-i18n](#configuring-cdn-in-tap-i18n)
    - [Disabling tap-i18n](#disabling-tap-i18n)
    - [Using tap-i18n in Cordova apps](#using-tap-i18n-in-cordova-apps)
- [Developing Packages](#developing-packages)
    - [tap-i18n Two Work Modes](#tap-i18n-two-work-modes)
    - [Setup tap-i18n](#setup-tap-i18n)
    - [Package Level tap-i18n Functions](#package-level-tap-i18n-functions)
    - [Using tap-i18n in Your Package Templates](#using-tap-i18n-in-your-package-templates)
- [Unit Testing](#unit-testing)
- [License](#license)
- [Credits](#credits)

## Key Features

### All Encompassing

tap-i18n is designed in a way that distinguishes the role of the package developer, that is, making the package available in multiple languages, from the role of the app developer which is to translate the app, but more importantly, to manage the app's internationalization aspects, such as: setting the supported languages for the project, setting the client language, configuring CDNs for language files, and so on.

### Readable Syntax

```handlebars
<div class="btn">{{_ "sign_up"}}</div>
```

### Advanced i18n

tap-i18n uses [i18next v1.11](http://i18next.github.io/i18next/) as its internationalization engine and exposes all its capabilities to the Meteor's templates - variables, dialects, count/context aware keys, and more.

**client/messages.html**

```handlebars
<template name="messages_today">
  <p>{{_ "inbox_status" "Daniel" 18 count=18}}</p>
</template>
```

**i18n/en.i18n.json**

```json
{
  "inbox_status": "Hey, %s! You have received one new message today.",
  "inbox_status_plural": "Hey, %s! You have received %s new messages today."
}
```
See more examples below.

### Transparent Namespacing

You don't need to worry about domain prefixing or package conflicts when you translate your project or package. Behind the scenes we automatically generate scoped namespaces for you.

### Ready to Scale

* Translations are unified into a single JSON file per language that includes both package and project-level translations
* On-demand: translations are loaded only when they are needed
* 3rd Party CDN Support


## Quickstart

**Step 1:** Install tap-i18n using meteor:

```bash
$ meteor add tap:i18n
```

**Step 2:** Add translation helpers to your markup:

**\*.html**

```handlebars
<div>{{_ "hello"}}</div>
```

**Step 3:** Define translations in JSON or YAML format:

**i18n/en.i18n.json**

```json
{ "hello": "Hey there" }
```

**i18n/fr.i18n.json**

```json
{ "hello": "Bonjour" }
```

**i18n/es.i18n.yml**

```yaml
hello: Hola
```

Translations files should end with lang_tag.i18n.json/yml.

You can split translations of a certain language to multiple files, we ignore
the prefixed text, e.g., we add the translations of menu.en.i18n.json in the
same way we add those of en.i18n.json .

You can put languages files anywhere in your project tree, as long as they are
common to both your server and client - **do not put languages files under
/client, /server or /public**.

Note: Languages files have to be saved in utf-8 encoding.

**Step 4:** Initiate the client language on startup (optional)

If you want the client to be served by a specific language on startup

Assuming that you have a function getUserLanguage() that returns the language
for tag for the current user.

```javascript
getUserLanguage = function () {
  // Put here the logic for determining the user language

  return "fr";
};

if (Meteor.isClient) {
  Meteor.startup(function () {
    Session.set("showLoadingIndicator", true);

    TAPi18n.setLanguage(getUserLanguage())
      .done(function () {
        Session.set("showLoadingIndicator", false);
      })
      .fail(function (error_message) {
        // Handle the situation
        console.log(error_message);
      });
  });
}
```

* If you won't set a language on startup your project will be served in the
  fallback language: English
* You probably want to show a loading indicator until the language is ready (as
  shown in the example), otherwise the templates in your projects will be in
  English until the language will be ready

## Documentation & Examples

### TAPi18n API

**TAPi18n.setLanguage(language\_tag) (Client)**

Sets the client's translation language.

Returns a jQuery deferred object that resolves if the language load
succeed and fails otherwise.

**Notes:**

  * language\_tag has to be a supported Language.
  * jQuery deferred docs: [jQuery Deferred](http://api.jquery.com/jQuery.Deferred/)

**TAPi18n.getLanguage() (Client)**

Returns the tag of the client's current language or null if
tap-i18n is not installed.

If inside a reactive computation, invalidate the computation the next time the
client language get changed (by TAPi18n.setLanguage)

**TAPi18n.getLanguages() (Anywhere)**

Returns an object with all the supported languages and their names.

Each call returns a new dictionary and new `{name, en}` records. Adding or
removing entries, or assigning record fields, does not change later results or
the library's language metadata. These copies are shallow: custom object-valued
names, if supplied, remain shared with the source metadata.

This getter is **not reactive**: use `getLanguage()` for the reactive selected
language. Direct metadata changes are reflected on the next call.

A language is considered supported if it is in the supported_languages array of
the project-tap.i18n json. If supported_languages is null or not defined in
project-tap.i18n we consider all the languages we find *.i18n.json/yml files to as
supported.

The returned object is in the following format:

```javascript
{
  'en': {
    'name':'English', // Local name
    'en':'English'    // English name
  },
  'zh': {
    'name':'中文'     // Local name
    'en':'Chinese'    // English name
  }
  .
  .
  .
}
```

**TAPi18n.getLanguagesCached() (Anywhere)**

Returns the same language tags and `{name, en}` fields as `getLanguages()`, or
`null` when translation is disabled. This opt-in getter returns a **shared,
read-only snapshot by reference**. Repeated reads reuse the same object until
the catalog is invalidated; cache hits do not copy or scan its entries.

The dictionary has no prototype, and both it and its records are frozen.
**Do not modify the returned object or its records.** Writes throw in strict
mode or have no effect otherwise. Use `getLanguages()` when you need mutable
copies, for example to attach UI-specific properties to each language.
The cached API requires both language names to be strings; missing metadata or
non-string names cause a `TypeError`. It never freezes your source metadata.
Registered tag spelling is preserved; this API does not canonicalize aliases
or change capitalization.

On the client, this getter establishes a Tracker dependency on every call,
including cache hits and disabled reads. Catalog invalidation reruns dependent
computations. Selecting another language or updating translation text does not
invalidate the catalog. On the server it shares the snapshot within the current
process, with no reactive dependency.

**TAPi18n.invalidateLanguagesCache() (Anywhere)**

Discards the current cached catalog and notifies its client Tracker dependency.
The next `getLanguagesCached()` call builds a new snapshot. Previously returned
snapshots remain unchanged. This method returns `undefined` and does not change
language selection or reload translation files.

The library calls it when enabling the project and after generated language
metadata is registered. If your application directly modifies `languages_names`
or `conf.supported_languages`, call it after your changes, in each affected
client or server process. Plain object writes cannot notify the cache or Tracker
automatically:

```javascript
TAPi18n.languages_names['pt-BR'] = ['Brazilian Portuguese', 'Português brasileiro'];
TAPi18n.invalidateLanguagesCache();

Tracker.autorun(function () {
  const languages = TAPi18n.getLanguagesCached();
  // Read this snapshot; use getLanguages() if you need to modify a result.
});
```

Without invalidation, cached reads keep their previous snapshot while legacy
`getLanguages()` reads reflect direct metadata changes immediately.

**TAPi18n.__(key, options, lang_tag=null) (Anywhere)**

*If `lang_tag` is null:*

Translates key to the current client's language. If inside a reactive
computation, invalidate the computation the next time the client language get
changed (by TAPi18n.setLanguage).

*Otherwise:*

Translates key to lang_tag. if you use `lang_tag` you should use `__` in a
reactive computation since the string will be translated to the current client
language if a translator to lang_tag is not ready in the client (if called for
the first time with that lang_tag, or until language data load from the server
finishes) and will get invalidated (trigger reactivity) when the translator to
that lang_tag is ready to be used to translate the key.

Using `i18next.t` `lng` option or `lang`, which we made as alias to `lang` in
tap:i18n, is equivalent to setting the `lang_tag` attribute.

The function is a proxy to the i18next.t() method.
Refer to the [documentation of i18next.t()](http://i18next.github.io/i18next/pages/doc_features.html)
to learn about its possible options. (Make sure you refer to i18next v1.11 documentation and not v2)

For a single sprintf argument, the second parameter can be a string or number:
`TAPi18n.__("greeting", "Ada", "nl")`. The third parameter remains the language
tag. For multiple formatting arguments, pass an options object such as
`{sprintf: ["Ada", 18]}`. Language-specific translators support the configured
i18next shorthand mode, including `defaultValue` when explicitly selected.

**On the server**, TAPi18n.__ is not a reactive resource. You have to specify
the language tag you want to translate the key to.

**Custom plural rules (Anywhere)**

The bundled engine resolves regional plural rules through the base language:
`en-US` uses the `en` rule. Replacing that rule with
`TAPi18next.pluralExtensions.addRule("en", rule)` updates the active cache
immediately; unrelated rules do not invalidate it. Register custom rules under
the base language tag; regional rule overrides are not supported.

**TAPi18n.loadTranslations(translations, namespace="project") (Anywhere)**

Use *translations* in addition or instead of the translations defined in the
i18n.json files. Translations defined by loadTranslations will have priority
over those defined in language files (i18n.json) of *namespace* (the project,
or package name).

To enjoy [the benefits of tap:i18n](#key-features), you should use language
files to internationalize your project whenever you can.

Legitimate cases for *loadTranslations* are:

* Allowing users to change the project translations
* Changing translations of 3rd party packages that you don't want to fork (see
  the Note below).

Example:

```javascript
TAPi18n.loadTranslations(
    {
        es: {
            meteor_status_waiting: "Desconectado"
        },
        fr: {
            meteor_status_failed: "La connexion au serveur a Ã©chouÃ©"
        }
    },
    "francocatena:status"
);
```

**Arguments:**

* `translations`: An object of the following format:

```javascript
{
    'lang-tag': {
        'translation-key1': 'translation',
        'translation-key2': 'translation',
        ...
    },
    ...
}
```

* `namespace="project"`: The namespace you want to add the translations to. by
  default translations are added to the project namespace, if you want to
  change a package translation use the package name as the namespace like the
  above example.

**Notes:**

* **Adding support to a new language in your app:** You can't use
  *addTranslations* in order to add support to a new language, that is, to allow
  users to change the interface language of the app to that language. In order
  to start support a new language in your app, you'll have to either add a
  language file to that language (*.i18n.json file) or add that languages to your
  project-tap.i18n file.

* **Translating a package that uses tap:i18n to another language**: If you want
  to add a new language to a 3rd party package (and you can't get it's owner to
  merge your pull request) consider introducing a "translation" package in which
  package-tap.i18n has the "namespace" options set to the package you are
  translating. That way you can translate with languages files instead of
  *addTranslations* and share your translation package with others.

### The tap-i18n Helpers

### The \_  Helper

To use tap-i18n to internationalize your templates you can use the \_ helper
that we set on the project's templates and on packages' templates for packages
that uses tap-i18n:

    {{_ "key" "sprintf_arg1" "sprintf_arg2" ... op1="option-value" op2="option-value" ... }}

**You can customize the helper name, see "Configuring tap-i18n" section.**

The translation files that will be used to translate key depends on the
template from which it is being used:
* If the helper is being used in a template that belongs to a package that uses
  tap-i18n we'll always look for the translation in that package's translation
  files.
* If the helper is being used in one of the project's templates we'll look for
  the translation in the project's translation files (tap-i18n has to be
  installed of course).

**Usage Examples:**

Assuming the client language is en.

**Example 1:** Simple key:

    en.i18n.json:
    -------------
    {
        "click": "Click Here",
        "html_key": "<b>BOLD</b>"
    }

    page.html:
    ----------
    <template name="x">
        {{_ "click"}}
        {{{_ "html_key"}}} <!-- Note that we use triple {{{ for html rendering -->
    </template>

    output:
    -------
    Click Here
    <b>BOLD</b>

**Example 2:** Simple key specific language:

    en.i18n.json:
    -------------
    {
        "click": "Click Here"
    }

    fr.i18n.json:
    -------------
    {
        "click": "Cliquez Ici"
    }

    page.html (lng and lang options are the same in tap:i18n you can use both):
    ----------
    <template name="x">
        {{_ "click" lang="fr"}} 
    </template>

    <template name="x">
        {{_ "click" lng="fr"}} 
    </template>

    output:
    -------
    Cliquez Ici

**Example 3:** Sprintf:

    en.i18n.json:
    -------------
    {
        "hello": "Hello %s, your last visit was on: %s"
    }

    page.html:
    ----------
    <template name="x">
        {{_ "hello" "Daniel" "2014-05-22"}}
    </template>

    output:
    -------
    Hello Daniel, your last visit was on: 2014-05-22

**Example 4:** Named variables and sprintf:

    en.i18n.json:
    -------------
    {
        "hello": "Hello __user_name__, your last visit was on: %s"
    }

    page.html:
    ----------
    <template name="x">
        {{_ "hello" "2014-05-22" user_name="Daniel"}}
    </template>

    output:
    -------
    Hello Daniel, your last visit was on: 2014-05-22

**Note:** Named variables have to be after all the sprintf parameters.

**Example 5:** Named variables, sprintf, singular/plural:

    en.i18n.json:
    -------------
    {
        "inbox_status": "__username__, You have a new message (inbox last checked %s)",
        "inbox_status_plural": "__username__, You have __count__ new messages (last checked %s)"
    }

    page.html:
    ----------
    <template name="x">
        {{_ "inbox_status" "2014-05-22" username="Daniel" count=1}}
        {{_ "inbox_status" "2014-05-22" username="Chris" count=4}}
    </template>

    output:
    -------
    Daniel, You have a new message (inbox last checked 2014-05-22)
    Chris, You have 4 new messages (last checked 2014-05-22)

**Example 6:** Singular/plural, context:

    en.i18n.json:
    -------------
    {
        "actors_count": "There is one actor in the movie",
        "actors_count_male": "There is one actor in the movie",
        "actors_count_female": "There is one actress in the movie",
        "actors_count_plural": "There are __count__ actors in the movie",
        "actors_count_male_plural": "There are __count__ actors in the movie",
        "actors_count_female_plural": "There are __count__ actresses in the movie",
    }

    page.html:
    ----------
    <template name="x">
        {{_ "actors_count" count=1 }}
        {{_ "actors_count" count=1 context="male" }}
        {{_ "actors_count" count=1 context="female" }}
        {{_ "actors_count" count=2 }}
        {{_ "actors_count" count=2 context="male" }}
        {{_ "actors_count" count=2 context="female" }}
    </template>

    output:
    -------
    There is one actor in the movie
    There is one actor in the movie
    There is one actress in the movie
    There are 2 actors in the movie
    There are 2 actors in the movie
    There are 2 actresses in the movie

* Refer to the [documentation of i18next.t() v1.11](http://i18next.github.io/i18next/pages/doc_features.html)
  to learn more about its possible options. (Make sure you refer to i18next v1.11 documentation and not v2)
* The translation will get updated automatically after calls to
  TAPi18n.setLanguage().

### More helpers

**{{languageTag}}:**

The {{languageTag}} helper calls TAPi18n.getLanguage().

It's useful when you need to load assets depending on the current language, for
example:

```handlebars
<template name="example">
  <img src="welcome_{{languageTag}}.png">
</template>
```

### Languages Tags and Translations Prioritization

We use the [IETF language tag system](http://en.wikipedia.org/wiki/IETF_language_tag)
for languages tagging. With it developers can refer to a certain language or
pick one of its dialects.

Example: A developer can either refer to English in general using: "en" or to
use the Great Britain dialect with "en-GB".

**If tap-i18n is install** we'll attempt to look for a translation of a certain
string in the following order:
* Language dialect, if specified ("pt-BR")
* Base language ("pt")
* Base English ("en")

**Notes:**

* We currently support only one dialect level. e.g. nan-Hant-TW is not
  supported.
* "en-US" is the dialect we use for the base English translations "en".
* If tap-i18n is not installed, packages will be served in English, the fallback language.

### Structure of Languages Files

Languages files should be named: arbitrary.text.lang_tag.i18n.json . e.g., en.i18n.json, menu.pt-BR.i18n.json.

You can have more than one file for the same language.

You can put languages files anywhere in your project tree, as long as they are
common to both your server and client - **do not put languages files under
/client, /server or /public**.

Example for languages files:

    en.i18n.json
    {
        "sky": "Sky",
        "color": "Color"
    }

    pt.i18n.json
    {
        "sky": "Céu",
        "color": "Cor"
    }

    fr.i18n.json
    {
        "sky": "Ciel"
    }

    en-GB.i18n.json
    {
        "color": "Colour"
    }

* Do not use colons and periods (see note below) in translation keys.
* To avoid translation bugs all the keys in your package must be translated to
  English ("en") which is the fallback language we use if tap-i18n is not installed,
  or when we can't find a translation for a certain key.
* In the above example there is no need to translate "sky" in en-GB which is the
  same in en. Remember that thanks to the Languages Tags and Translations
  Prioritization (see above) if a translation for a certain key is the same for a
  language and one of its dialects you don't need to translate it again in the
  dialect file.
* The French file above have no translation for the color key above, it will
  fallback to English.
* Check [i18next features documentation](http://i18next.github.io/i18next/pages/doc_features.html) for
  more advanced translations structures you can use in your JSONs files (Such as
  variables, plural form, etc.).   (Make sure you refer to i18next v1.11 documentation and not v2)

#### A note about dot notation

Note that `{_ "foo.bar"}` will be looked under `{foo: {bar: "Hello World"}}`, and not under `"foo.bar"`.

### Configuring tap-i18n

To configure tap-i18n add to it a file named **project-tap.i18n**.

This JSON can have the following properties. All of them are optional. The values bellow
are the defaults.

    project-root/project-tap.i18n
    -----------------------------
    {
        "helper_name": "_",
        "supported_languages": null,
        "i18n_files_route": "/tap-i18n",
        "preloaded_langs": []
    }

Options:

**helper\_name:** the name for the templates' translation helper.

**supported\_languages:** A list of languages tags you want to make available on
your project. If null, all the languages we'll find translation files for, in the
project, will be available.

**i18n\_files\_route:** The route in which the tap-i18n resources will be available in the project.

**preloaded_langs:** An array of languages tags. If isn't empty, a single synchronous ajax requrest will load the translation strings for all the languages tags listed. If you want to load all the supported languages set preloaded_langs to `["*"]` (`"*"` must be the first item of the array, the rest of the array will be ignored. `["zh-*"]` won't work).
An alernative way to dynamically set preloaded_langs on runtime is by defining the **TAP_I18N_PRELOADED_LANGS** global variable. This variable should be an array of language tags.
```html
<head>
  <script>
    TAP_I18N_PRELOADED_LANGS = ["pt-BR", "zh-TW", "he"];
  </script>
  <!-- ... The JS Bundle of your Meteor APP ... -->
</head>
```

**Notes:**

* English is loaded by default, so you don't need to include it in the preloaded language list.
* We use AJAX to load the languages files so you'll have to set CORS on your CDN.
* Support of TAP_I18N_PRELOADED_LANGS relies on the `project-tap.i18n` build plugin. In other words, if `project-tap.i18n` doesn't exist, TAP_I18N_PRELOADED_LANGS will have **no** effect.
* Preloaded languages are the union of `preloaded_langs` (specified in `project-tap.i18n`) and `TAP_I18N_PRELOADED_LANGS` (specified in the `<head>`).
Examples:
   1. `preloaded_langs = ["fr"] `
   `TAP_I18N_PRELOADED_LANGS = ["he"]`
  Result: "fr" and "he" will be preloaded
  2. `preloaded_langs = ["*"]`
	  **All** languages will be preloaded, regardless of whether TAP_I18N_PRELOADED_LANGS is defined.
	3. `preloaded_langs = ["ar"]`
	    `TAP_I18N_PRELOADED_LANGS = ["ar", "vi"]`
	    Result: "ar" and "vi" will be preloaded.

### Configuring CDN in tap-i18n

To utilize a Content Delivery Network (CDN) with tap:i18n, invoke `TAPi18n.setCdnCb(cb)`. This function expects cb, a callback function, which receives a URL path as its parameter and should return the CDN-modified URL.

**Important:** If your project incorporates project-tap.i18n, it is crucial to execute TAPi18n.setCdnCb(cb) before project-tap.i18n loads. Arrange your configuration files such that the one for CDN setup is named in a way that it loads lexicographically prior to project-tap.i18n.

For instance, in JustDo.com, the CDN setup is managed as follows:

```coffeescript
# /lib/030-i18n/000-tap-i18n-cdn-loader.coffee
TAPi18n.setCdnCb JustdoCoreHelpers.getCDNUrl
```

This configuration file is placed lexicographically before /lib/030-i18n/project-tap.i18n in the directory structure, ensuring the correct load order.

### Disabling tap-i18n

**Step 1:** Remove tap-i18n method calls from your project.

**Step 2:** Remove tap-i18n package

```bash
$ meteor remove tap:i18n
```

### Using tap-i18n in Cordova apps

In order to use tap-i18n in a Cordova app you must set the `--server` flag
to your server's root url when building your project.

```bash
$ meteor build --server="http://www.your-site-domain.com"
```

If your app should work when the user is offline, install the [tap:i18n-bundler](https://atmospherejs.com/tap/i18n-bundler) package and follow [its instructions](https://github.com/TAPevents/i18n-bundler#usage).

## Developing Packages

Though the decision to translate a package and to internationalize it is a
decision made by the **package** developer, the control over the
internationalization configurations are done by the **project** developer and
are global to all the packages within the project.

Therefore if you wish to use tap-i18n to internationalize your Meteor
package your docs will have to refer projects developers that will use it to
the "Usage - Project Developers" section above to enable internationalization.
If the project developer won't enable tap-i18n your package will be served in
the fallback language English.

### tap-i18n Two Work Modes

tap-i18n can be used to internationalize projects and packages, but its
behavior is determined by whether or not it's installed on the project level.
We call these two work modes: *enabled* and *disabled*.

When tap-i18n is disabled we don't unify the languages files that the packages
being used by the project uses, and serve all the packages in the fallback
language (English)

### Setup tap-i18n

In order to use tap-i18n to internationalize your package:

**Step 1:** Add the package-tap.i18n configuration file:

You can use empty file or an empty JSON object if you don't need to change them.

The values below are the defaults.

    package_dir/package-tap.i18n
    ----------------------------
    {
        // The name for the translation function that
        // will be available in package's namespace.
        "translation_function_name": "__", 

        // the name for the package templates' translation helper
        "helper_name": "_", 
        
        // directory for the translation files (without leading slash)
        "languages_files_dir": "i18n",

        // tap:i18n automatically separates the translation strings of each package to a
        // namespace dedicated to that package, which is used by the package's translation
        // function and helper. Use the namespace option to set a custom namespace for
        // the package. By using the name of another package you can use your package to
        // add to that package or modify its translations. You can also set the namespace to
        // "project" to add translations that will be available in the project level.
        "namespace": null 
    }

**Step 2:** Create your languages\_files\_dir:

Example for the default languages\_files\_dir path and its structure:

    .
    |--package_name
    |----package.js
    |----package-tap.i18n
    |----i18n # Should be the same path as languages_files_dir option above
    |------en.i18n.json
    |------fr.i18n.json
    |------pt.i18n.json
    |------pt-BR.i18n.json
    .
    .
    .

NOTE: the file for the fallback language (`en.i18n.json`) **must** exist (it may be empty though).

The leanest set up (for instance in a private package, where you keep the translations at the project level) is two empty files: `package-tap.i18n` and `i18n/en.i18n.json`.

**Step 3:** Setup your package.js:

Your package's package.js should be structured as follow:

    Package.onUse(function (api) {
      api.use(["tap:i18n"], ["client", "server"]);

      .
      .
      .

      // You must load your package's package-tap.i18n before you load any
      // template
      api.addFiles("package-tap.i18n", ["client", "server"]);

      // Templates loads (if any)

      // List your languages files so Meteor will watch them and rebuild your
      // package as they change.
      // You must load the languages files after you load your templates -
      // otherwise the templates won't have the i18n capabilities (unless
      // you'll register them with tap-i18n yourself, see below).
      api.addFiles([
        "i18n/en.i18n.json",
        "i18n/fr.i18n.json",
        "i18n/pt.i18n.json",
        "i18n/pt-br.i18n.json"
      ], ["client", "server"]);
    });

Note: en, which is the fallback language, is the only language we integrate
into the clients bundle. All the other languages files will be loaded only
to the server bundle and will be served as part of the unified languages files,
that contain all the project's translations.

### Package Level tap-i18n Functions

The following functions are added to your package namespace by tap-i18n:

**\_\_("key", options, lang_tag) (Anywhere)**

Read documenation for `TAPi18n.__` above.

**On the server**, TAPi18n.__ is not a reactive resource. You have to specify
the language tag you want to translate the key to.

You can use package-tap.i18n to change the name of this function.

**registerI18nHelper(template\_name) (Client)**

**registerTemplate(template\_name) (Client) [obsolete alias, will be removed in future versions]**

Register the \_ helper that maps to the \_\_ function for the
template with the given name.

**Important:** As long as you load the package templates after you add package-tap.i18n
and before you start adding the languages files you won't need to register templates yourself.

### Using tap-i18n in Your Package Templates

See "The tap-i18n helper" section above.

## Unit Testing

The suite uses Mocha and Chai on a real Meteor server and in headless Chrome.
It runs fast compiler and runner regression suites, then compiles fixture translation files
through the package's actual Meteor build plugin.
All tests, fixtures, and runner dependencies live in this repository.

Prerequisites:

* Meteor, with access to download the selected release and its packages.
* Node.js 22.12 or newer and npm for the **test runner only**. Meteor uses its own
  bundled Node.js; this does not change tap:i18n's runtime requirements.
* An installed Chrome or Chromium. The runner finds common macOS/Linux install
  locations; set `CHROME_BIN` for another location. `puppeteer-core` does not
  download a browser. The runner currently supports macOS and Linux.

The npm scripts are defined in `tests/package.json`; there is no root npm
package to install. `--prefix tests` selects that package, so run these commands
from the tap-i18n checkout:

```bash
npm ci --prefix tests
npm test --prefix tests
```

The default validation release is Meteor 2.16. To select another compatible
release or Chrome executable:

```bash
METEOR_RELEASE=2.16 CHROME_BIN=/path/to/chrome npm test --prefix tests
```

Meteor 2.x's bundled Mongo may require Rosetta on Apple Silicon. If it cannot
start, select an already installed native `mongod` executable, for example:

```bash
MONGOD_BIN=/opt/homebrew/bin/mongod npm test --prefix tests
```

This starts a separate, temporary Mongo process bound to localhost; it does not
use an existing database or service. The runner stops it after each scenario.

The runner creates disposable fixture applications and invokes
`meteor test --full-app --once --driver-package meteortesting:mocha`, with the
driver pinned to version 3.2.0. It uses the driver's manual-browser mode, opens
Chrome with Puppeteer, and reads Mocha's JSON reports for both environments.
The runner owns process shutdown and exits nonzero for assertion failures,
missing or skipped client/server tests, browser errors, unexpected compiler
outcomes, or timeouts. A successful run prints `PASS` for each scenario, ends
with `All ... scenarios passed.`, and exits with status 0. A scenario reporting
`expected compiler rejection` is a passing negative test: invalid input was
correctly rejected. Shared Mocha settings reject exclusive (`.only`), pending
or skipped tests, and empty suites, so a focused debug test cannot silently
reduce the automated run. This is a validation baseline, not a claim that every
Meteor release or browser has been tested.

Tests use `describe`/`it`, Chai `expect` assertions, and promises/`async`/`await`.
They live under `tests/mocha/both`, `tests/mocha/client`, and `tests/mocha/server`.
`Package.onTest` in `package.js` also wires these files for standard package
testing of the disabled baseline. Production `Package.onUse` does not load them.
The automated `package-api` scenario copies the package source without installed
dependencies or build state and gives Meteor a separate npm installation with
the fixture's exact dependency versions. This prevents Meteor's package-test
bundler from rewriting the host runner's `tests/node_modules`.

Scenarios:

| Scenario | Coverage |
| --- | --- |
| `disabled` | No project translations/configuration; disabled getters and language selection |
| `package-api` | The same disabled baseline through `Package.onTest` and `meteor test-packages` |
| `inferred` | Inferred language list, JSON/YAML merging, fallback and dialect loading, README plural example rendered in Blaze |
| `catalog-initialization` | Cached reads before enablement, inside enablement, and between generated language files |
| `configured` | Explicit language filtering, duplicate tags, custom helper/HTTP route, language without a translation file |
| `preloaded` | `preloaded_langs: ["*"]` through the real HTTP endpoint |
| `raw-config` | Existing noncanonical configuration behavior, including the missing-metadata error |
| `package`, `package-configured` | Package configuration, separate namespace and template helper, with implicit or explicit project enablement |
| `mixed-formats` | YAML/JSON/YAML override order and isolation between two package namespaces |
| `late-package-config`, `duplicate-package-config` | Compiler rejects late or duplicate package configuration |
| `invalid-case` | Compiler rejects incorrectly cased translation filenames |
| `client-file`, `server-file` | Compiler rejects project translation files restricted to one architecture |
| `invalid-config` | Compiler rejects the wrong type for `supported_languages` |

The package scenarios cover translations supplied before project enablement,
including languages discovered later from project files. The mixed-format
fixture checks YAML/JSON override order and isolation between two namespaces.
The Node Mocha suite in `tests/compiler` additionally exercises repeated compiler
batches, target changes, empty batches, and recovery after errors. It loads the
actual plugin sources with a small InputFile adapter; schema validation and
runtime integration are covered by the real Meteor scenarios. Language-name
regressions execute compiler output from both translation files and explicit
configuration. HTTP tests verify JSON content types, CORS, and empty responses
through the default and custom routes.

The client/server unit suites also cover fixed-language shorthand arguments,
null and object options, language overrides, and plural-rule replacement.

The suite also checks cached snapshot identity, mutation protection, explicit
invalidation, startup invalidation, and Tracker dependencies on cache hits.
The enabled scenarios check independent mutable `getLanguages()` results,
direct metadata updates, unchanged spelling of programmatic translation tags,
runtime translation precedence, Tracker behavior, and single/multi language HTTP
responses. These are characterization tests of existing behavior, including its
limitations; a deliberate breaking change must update the relevant tests and
document the migration in this README and `ChangeLog`.

Useful commands:

```bash
npm run test:compiler --prefix tests  # Fast compiler tests, no Meteor/Chrome/Mongo
npm run test:runner --prefix tests    # Runner regressions, no Meteor/Chrome/Mongo
npm test --prefix tests -- --list
npm test --prefix tests -- inferred configured
KEEP_TEST_TMP=1 npm test --prefix tests
BENCHMARK=1 KEEP_TEST_TMP=1 npm test --prefix tests -- inferred
```

The optional benchmark runs in the `inferred` scenario and prints timings in `client.log` and
`meteor.log`: median microseconds per read across five samples of 50,000 reads,
for 4, 64, and 256 languages. It compares fresh mutable copies with warm cached
reads outside a Tracker computation. Cache construction, invalidation, and
dependent computations are excluded. Timings are diagnostic, not a pass/fail
threshold; correctness assertions still run.

Each scenario has an isolated temporary app, local Mongo database, and browser
context. The runner checks a block of three local ports before starting Meteor,
clears inherited database/settings/package-override variables, and stops its
processes after each scenario. This port check is not an atomic reservation;
another process taking the ports will fail the run. Logs and generated apps are
retained on failure, or when `KEEP_TEST_TMP=1`; their directory is printed.
Browser console output and page errors are saved in `client.log`, including
when navigation or test completion fails or times out.
Successful runs otherwise remove their temporary files. `TEST_TIMEOUT_MS`
overrides the ten-minute per-scenario deadline (including a first-time build),
and `METEOR_BIN` selects a Meteor executable.

For interactive inspection of the disabled baseline, Meteor's standard driver
also works:

```bash
TEST_WATCH=1 meteor --release 2.16 test-packages ./ --driver-package meteortesting:mocha
```

Use the npm runner for the full fixture matrix. The old Meteorite/PhantomJS
`unittest/` instructions no longer apply.

## License

MIT

## Author

[Daniel Chcouri](https://www.linkedin.com/in/danielchcouri/)

## Contributors

* [Chris Hitchcott](https://github.com/hitchcott/)
* [Brian Chan](http://github.com/iovecoldpizza)
* [Kevin Iamburg](http://www.slickdevelopment.com)
* [Abe Pazos](https://github.com/hamoid/)
* [@karfield](https://github.com/karfield/)
* [@nscarcella](https://github.com/nscarcella/)
* [@mpowaga](https://github.com/mpowaga/)

## Credits

* [i18next v1.11](http://i18next.github.io/i18next/)
* [simple-schema](https://github.com/aldeed/meteor-simple-schema)
* [http-methods](https://github.com/CollectionFS/Meteor-http-methods)
