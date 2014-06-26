# tap-i18n 

### Internationalization for Meteor

**tap-i18n** is a smart package for [Meteor](http://www.meteor.com) that provides a comprehensive [i18n](http://www.i18nguy.com/origini18n.html) solution for project and package developers.

## Key Features

### Readable Syntax

```handlebars
<div class="btn">{{_ "sign_up"}}</div>
```

### Advanced i18n

tap-i18n uses [i18next](http://i18next.com/) as its internationalization engine and exposes all its capabilities to the Meteor's templates - variables, dialects, count/context aware keys, and more.

**client/messages.html**

```handlebars
<template name="messages_today">
  <p>{{_ "inbox_status" "Daniel" count=18}}</p>
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

### All Encompassing

Understanding the different perspectives of project and package developers, tap-i18n provides specific tools for project and package developers, allowing for total coverage and seamless integration into the Meteor package ecosystem.

### Transparent Namespacing 

You don't need to worry about domain prefixing or package conflicts when you translate your project or package. Behind the scenes we automatically generate scoped namesapaces for you.

### Ready to Scale

* Translations are unified into a single JSON file per language that includes both package and project-level translations
* On-demand: translations are loaded only when they are needed
* 3rd Party CDN Support


## Quickstart for Project Developers

**Step 1:** Install tap-i18n using meteorite in your project's root directory:

```bash
$ mrt add tap-i18n
```

**Step 2:** Add translation helpers to your markup:

**\*.html**

```handlebars
<div>{{_ "hello"}}</div>
```

**Step 3:** Define translations in JSON format under the /i18n folder in your project's root:
  
**i18n/en.i18n.json**

```json
{ "hello": "Hey there" }
```

**i18n/fr.i18n.json**

```json
{ "hello": "Bonjour" }
```

**Step 4:** Initiate the client language on startup

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
  default language: English
* You probably want to show a loading indicator until the language is ready (as
  shown in the example), otherwise the templates in your projects will be in
  English until the language will be ready

## Documentation & Examples

### TAPi18n API

**TAPi18n.setLanguage(language\_tag) (Client)**

Sets the client's translation language.

Returns a jQuery deferred object that resolves if the language load
succeed and fails otherwise.

Notes:
  * language\_tag has to be a supported Language.
  * jQuery deferred docs: [jQuery Deferred](http://api.jquery.com/jQuery.Deferred/)

**TAPi18n.getLanguage() (Client)**

Returns the tag of the client's current language or null if
tap-i18n is not installed.

If inside a reactive computation, invalidate the computation the next time the
client language get changed (by TAPi18n.setLanguage)

**TAPi18n.getLanguages() (Client)**

Returns an object with all the languages the project or one of the packages it uses are translated to.

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

**TAPi18n.__(key, options) (Client)**

Translates key to the current client's language. If inside a reactive
computation, invalidate the computation the next time the client language get
changed (by TAPi18n.setLanguage).

The function is a proxy to the i18next.t() method. 
Refer to the [documentation of i18next.t()](http://i18next.com/pages/doc_features.html)
to learn about its possible options.

### The tap-i18n Handlebars Helper

To use tap-i18n to internationalize your templates you can use the \_ helper
that we set on the project's templates and on packages' templates for packages
that uses tap-i18n:

    {{_ "key" "sprintf_arg1" "sprintf_arg2" ... op1="option-value" op2="option-value" ... }}

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
        "click": "Click Here"
    }

    page.html:
    ----------
    <template name="x">
        {{_ "click"}}
    </template>

    output:
    -------
    Click Here

**Example 2:** Sprintf:

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

**Example 3:** Named variables and sprintf:

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

**Example 4:** Named variables, sprintf, singular/plural:

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

**Example 5:** Singular/plural, context:

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

* Refer to the [documentation of i18next.t()](http://i18next.com/pages/doc_features.html)
  to learn more about its possible options.
* The translation will get updated automatically after calls to
  TAPi18n.setLanguage().

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

Notes:
* We currently support only one dialect level. e.g. nan-Hant-TW is not
  supported.
* "en-US" is the dialect we use for the base English translations "en".
* If tap-i18n is not installed, packages will be served in English, the fallback language.

### Structure of Languages Files

Languages files must be named by their language tag name with the i18n.json
suffix.

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

* To avoid translation bugs all the keys in your package must be translated to
  English ("en") which is the default language, and the fallback language when
  tap-i18n is not installed or when it can't find a translation for a certain key.
* In the above example there is no need to translate "sky" in en-GB which is the
  same in en. Remember that thanks to the Languages Tags and Translations
  Prioritization (see above) if a translation for a certain key is the same for a
  language and one of its dialects you don't need to translate it again in the
  dialect file.
* The French file above have no translation for the color key above, it will
  fallback to English.
* Check [i18next features documentation](http://i18next.com/pages/doc_features.html) for
  more advanced translations structures you can use in your JSONs files (Such as
  variables, plural form, etc.).

### Adding your Project Translation Files

To translate keys that you use in your project create the languages\_files\_dir
directory (default: "i18n") in your project's root, and add your translation
files to it, as follow:

    |--project-root
    |----i18n # Should be the same path as the languages_files_dir option
    |------en.i18n.json
    |------fr.i18n.json
    |------pt.i18n.json
    |------pt-BR.i18n.json
    .
    .
    .

* If you only want to install tap-i18n to configure the internationalization of
  packages you use in your project that use tap-i18n you don't have to create
  the languages\_files\_dir.
* If you want to put your languages files in another directory refer to the
  "Configuring tap-i18n build process" section below.
* Refer to the "Structure of Languages Files" section above to learn how to
  build your languages files.

### Configuring tap-i18n Build Process

To configure tap-i18n add the **project-tap.i18n** configuration file to your **project root** (the values below are the defaults):

    project-root/project-tap.i18n
    -----------------------------
    {
        "languages_files_dir": "i18n",
        "supported_languages": null,
        "build_files_path": null,
        "browser_path": null
    }

Options:

**languages\_files\_dir:** the path to your languages files directory relative to your project root

**supported\_languages:** A list of languages tags you want to make available on your project. If null, all the languages we'll find translation files for will be available.

**build\_files\_path:** Can be an absolute path or relative to the project's root. If you change this value we assume you want to serve the files yourself (via cdn, or by other means) so we won't initiate the tap-i18n's built-in files server. Therefore if you set build\_files\_path you **must** set the browser\_path.

**browser\_path:** Can be a full url, or an absolute path. Examples:
"http://cdn.domain.com/i18n/", "/custom-i18n/"

**Important**: **You must** set browser\_path if you set build\_files\_path.
If build\_files\_path is null we ignore browser\_path.

Notes: 
* We use AJAX to load the languages files so if your browser\_path is in
  another domain you'll have to set CORS on it.
* If you specify a dialect as one of the supported languages its
  base language will be supported also. Since English is used by tap-i18n as
  the fallback language it is always supported, even if it isn't listed in the
  array.

**Important:** if you set this file it has to be in your package root.

### Disabling tap-i18n

**Step 1:** Remove tap-i18n method calls from your project.

**Step 2:** Remove tap-i18n package

    $ mrt remove tap-i18n

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

**Step 1:** Add the package-tap.i18n configuration file to your **package root**:

The values below are the defaults, you can use empty JSON object if you don't
need to change them.

    package_dir/package-tap.i18n
    ----------------------------
    {
        "languages_files_dir": "i18n" // the path to your languages files
                                      // directory relative to your package root
    }

**Important:** You must set this file in your package root.

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

**Step 3:** Setup your package.js:

Your package's package.js should be structured as follow:

    Package.on_use(function (api) {
      api.use(["tap-i18n"], ["client", "server"]);
    
      .
      .
      .
    
      // You must load your package's package-tap.i18n before you load any
      // template
      api.add_files("package-tap.i18n", ["client", "server"]);
    
      // Templates loads (if any)
    
      // List your languages files so Meteor will watch them and rebuild your
      // package as they change.
      // You must load the languages files after you load your templates -
      // otherwise the templates won't have the i18n capabilities (unless
      // you'll register them with tap-i18n yourself, see below).
      api.add_files([
        "i18n/en.i18n.json",
        "i18n/fr.i18n.json",
        "i18n/pt.i18n.json",
        "i18n/pt-br.i18n.json"
      ], ["client"]);
    });

Note: The fact that all the languages files are added in the package.js doesn't
mean that they will all actually be loaded for every single client that uses
your package. We use this listing for two purposes: (1) to be able to watch
these files for changes to trigger rebuild, and (2) to have a mark in the
package loading process in which we know all the templates of the package
are loaded so we can register them with tap-i18n.

### Package Level tap-i18n Functions

The following functions are added to your package namespace by tap-i18n:

**\_\_("key", options) (Client)**

Translates key to the current client's language. If inside a reactive
computation, invalidate the computation the next time the client language get
changed (by TAPi18n.setLanguage).

The function is a proxy to the i18next.t() method. 
Refer to the [documentation of i18next.t()](http://i18next.com/pages/doc_features.html)
to learn about its possible options.

**registerTemplate(template\_name) (Client)**

This function defines the \_ helper that maps to the \_\_ function for the
template with the given name.

**Important:** tap-i18n registers the templates defined by your package prior to
startup automatically. You have to register only templates that you define
dynamically after Meteor loads (otherwise the \_ helper will be linked to the
project level keys).

### Using tap-i18n in Your Package Templates

See "The tap-i18n Handlebars helper" section above.

## Deploying Projects That Uses tap-i18n with meteor bundle

If you use `meteor bundle` to deploy your meteor project you'll have add the
unified languages files to the bundle in order for it to work. follow these
steps:

    $ cd your-meteor-project
    $ meteor bundle new-bundle.tar.gz
    $ tar -xvzf new-bundle.tar.gz
    $ rm new-bundle.tar.gz
    $ cp -r .meteor/local/tap-i18n bundle
    $ tar -cvzf new-bundle.tar.gz bundle
    $ rm -ri bundle # -ri is used to avoid mistakes use -rf

## Deploying Projects That Uses tap-i18n to \*.meteor.com

If you wish to deploy your project to Meteor's cloud set your project-tap.i18n as
follow:

    project-tap.i18n:
    -----------------
    {
        "build_files_path": "public/tap-i18n",
        "browser_path": "/tap-i18n"
    }

and then call `meteor deploy` as usual.

## Unit Testing

We have more than one unittest to test the different ways tap-i18n might be used in a
certain project, to test all of them run:

    $ ./unittest/unittest-all

The unittest will be available on: [http://localhost:3000](http://localhost:3000) .

Every time you'll break the run of the above command (every time you'll
press ctrl+c) the next test constellation will run, refresh your browser to load
the new constellation.

You can also test a specific constellation:

    # tap-i18n is disabled in the project level
    $ ./unittest/unittest-disabled 

    # tap-i18n enabled in the project level - default project-tap.i18n
    $ ./unittest/unittest-enabled

    # tap-i18n enabled in the project level - custom supported language is set on project-tap.i18n
    $ ./unittest/unittest-enabled_custom_supported_languages

    # tap-i18n enabled in the project level - custom build files path is set on project-tap.i18n
    $ ./unittest/unittest-enabled_custom_build_files_path 

    # tap-i18n enabled in the project level - project level translations
    $ ./unittest/unittest-test_enabled_project_level_translations

    # tap-i18n enabled in the project level - project level translations in a custom translation dir
    $ ./unittest/unittest-test_enabled_project_level_translations_custom_translations_dir

    # tap-i18n package has no translation for the fallback language. Since the
    # build fails for this environment, there are only bash test for it. Break
    # (ctrl+c) after Meteor build fails to run bash tests.
    $ ./unittest/unittest-package_with_no_fallback_language 

    # tap-i18n package has a translation to a dialect but not to its base language.
    # Since the build fails for this environment, there are only bash test for
    # it. Break (ctrl+c) after Meteor build fails to run bash tests.
    $ ./unittest/unittest-package_with_no_base_lang_for_dialect 

## Lisence

MIT

## Author

[Daniel Chcouri](http://theosp.github.io/)

## Contributors

[Chris Hitchcott](https://github.com/hitchcott/)

## Credits

* [i18next](http://i18next.com/)
* [wrench-js](https://github.com/ryanmcgrath/wrench-js)
* [simple-schema](https://github.com/aldeed/meteor-simple-schema)
* [http-methods](https://github.com/CollectionFS/Meteor-http-methods)

Sponsored by [TAPevents](http://tapevents.com)
