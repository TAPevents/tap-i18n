tap-i18n - Meteor Internationalization
======================================

tap-i18n is a smart package for Meteor that provides a comprehensive
internationalization solution for project and package developers.

tap-i18n encapsulates the [i18next](http://i18next.com/) JavaScript library to
make its capabilities available for Meteor developers.

tap-i18n can be used to internationalize projects and packages, but its
behavior is determined only by wheather it's **enabled** or **disabled**
meaning: whether or not it's installed on the project level.

First, only when tap-i18n is enabled setting the client language is possible.
The packages the project uses that use tap-i18n will be served in English if
tap-i18n is disabled.

Second, when tap-i18n is enabled we deliver the needed translations for each
language in one unified file (that includes both the project and packages
translations). These files are being built automatically during the project's
build process and get updated automatically if the translations change.

When tap-i18n is enabled translations files are delivered as seperate resources
only when they are needed. tap-i18n gives the project developer the flexibility
to choose how these files will be delivered to the clients (Meteor internal
files server, nginx, cdn, etc.).

If tap-i18n is disabled, the packages the project uses that use tap-i18n will
be served in English. The language data will be delivered as part of the
packages' files and not as a seperate unified resource.

The tap-i18n Handlebars helper:
-------------------------------

To use tap-i18n to internationalize your templates you can use the \_ helper
that we set on the project's templates and on packages' templates for packages
that uses tap-i18n:

    {{_ "key" "sprintf_arg1" "sprintf_arg2" ... op1="option-value" op2="option-value" ... }}

The translation files that will be used to translate key depeneds on the
template from which it is being used:
* If the helper is being used in a template that belongs to a package that uses
  tap-i18n we'll always look for the translation in that package's translation
  files (defined by the languages\_files\_dir option).
* If the helper is being used in one of the project's templates we'll look for
  the translation in the project's translation files (tap-i18n has to be enabled
  of course).

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
    <template "x">
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
    <template "x">
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
    <template "x">
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
    <template "x">
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
    <template "x">
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

Notes:

* Refer to the [documentation of i18next.t()](http://i18next.com/pages/doc_features.html)
  to learn more about its possible options.
* The translation will get updated automatically after calls to
  TAPi18n.setLanguage().

Languages Tags and Translations Prioritization
----------------------------------------------

We use the [IETF language tag system](http://en.wikipedia.org/wiki/IETF_language_tag)
for languages tagging. With it developers can refer to a certain language or
pick one of its dialects.

Example: A developer can either refer to English in general using: "en" or to
use the Great Britain dialect with "en-GB".

**If tap-i18n is enabled** (i.e. installed in the project level) we'll attempt
to look for a translation of a certain string in the following order:
* Language dialect, if specified ("pt-BR")
* Base language ("pt")
* Base English ("en")

Notes:
* We currently support only one dialect level. e.g. nan-Hant-TW is not
  supported.
* "en-US" is the dialect we use for the base English translations "en".
* If tap-i18n is disabled packages the project uses will be served in English.

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

Notes:

* To avoid translation bugs all the keys in your package must be translated to
  English ("en") which is the default language and the fallback language when
  we can't find a translation for a key.
* Remember that thanks to the Languages Tags and Translations Prioritization
  (see above) if a translation for a certain key is the same for a language and
  its dialect you don't need to translate it again in the dialect file. Thus,
  in the above example there is no need to translate "sky" in en-GB which is the
  same in en.
* The French file above have no translation for the color key above, it will
  fallback to English.
* Check [i18next features documentation](http://i18next.com/pages/doc_features.html) for
  more advanced translations structures you can use in your JSONs files (Such as
  variables, plural form, etc.).

Usage - Project Developers
--------------------------

You need to enable tap-i18n if you want to use it to internationalize your
project or to be able to configure the internationalization of packages you use
in your project that use tap-i18n.

### Enabling tap-i18n

**Step 1:** Add the tap-i18n package:

    $ mrt add tap-i18n

**Step 2:** Set a language on the client startup:

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

Notes:
* Read TAPi18n.setLanguage() documentation in the API section below.
* If you won't set a language on startup your project will be served in the
  fallback language: English.
* You probably want to show a loading indicator until the language is ready (as
  shown in the example), otherwise the templates in your projects will be in
  the fallback language English until the language will be ready.

### Configuring tap-i18n build process: 

To configure tap-i18n add the **project-tap.i18n** configuration file to your
**project root** (the values below are the defaults):

    project-root/project-tap.i18n
    -----------------------------
    {
        languages_files_dir: "i18n" // the path to your languages files
                                    // directory relative to your project root
        supported_languages: null, // A list of languages tags you want to make
                                   // available on your project. If null, all
                                   // the languages we'll find translation files
                                   // for will be available.
        build_files_path: "public/i18n", // can be a relative to project root or absolute
        browser_path: "/i18n" // can be a full url, or an absolute path on the project domain
    }

Notes: 
* We use AJAX to load the languages files so if your browser\_path is in
  another domain you'll have to set CORS on it.
* If you specify a dialect as one of the supported languages its
  base language will be supported also. Since English is used by tap-i18n as
  the fallback language it is always supported, even if it isn't listed in the
  array.

**Important:** if you set this file it has to be in your package root.

### Adding your project translation files

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

Notes:
* If you only want to enable tap-i18n to configure the internationalization of
  packages you use in your project that use tap-i18n you don't have to create
  the languages\_files\_dir.
* If you want to put your languages files in another directory refer to the
  "Configuring tap-i18n build process" section above.
* Refer to the "Structure of Languages Files" section above to learn how to
  build your languages files.

### Disabling tap-i18n:

**Step 1:** Remove the startup procedure you defined when enabling tap-i18n.

**Step 2:** Remove tap-i18n 

   $ mrt remove tap-i18n

### TAPi18n API:

**TAPi18n.setLanguage(language\_tag) (Client)**

Sets the client's translation language.

Returns a jQuery deferred object that resolves if the language load
succeed and fails otherwise.

Notes:
  * language\_tag has to be a supported language.
  * jQuery deferred docs: [jQuery Deferred](http://api.jquery.com/jQuery.Deferred/)

**TAPi18n.getLanguage() (Client)**

Returns the language tag of the client's translation language or null if
tap-i18n is not enabled in the project level.

If inside a reactive computation, invalidate the computation the next time the
client language get changed (by TAPi18n.setLanguage)

**TAPi18n.__(key, options) (Client)**

Translates key to the current client's language. If inside a reactive
computation, invalidate the computation the next time the client language get
changed (by TAPi18n.setLanguage).

The function is a proxy to the i18next.t() method. 
Refer to the [documentation of i18next.t()](http://i18next.com/pages/doc_features.html)
to learn about its possible options.

Usage - Package Developers
--------------------------

Though the decision to translate a package and to internationalize it is a
decision made by the **package** developer, the control over the
internationalization configurations are done by the **project** developer and
are global to all the packages within the project.

Therefore if you'll wish to use tap-i18n to internationalize your Meteor
package your docs will have to refer projects developers that will use it to
the "Usage - Project Developers" section above to enable internationalization.
If the project developer won't enable tap-i18n your package will be served in
English.

### Setup tap-i18n

In order to use tap-i18n to internationalize your package:

**Step 1:** Add the package-tap.i18n configuration file to your **package root**:

The values below are the defaults, you can use empty JSON object if you don't
need to change them.

    package_dir/package-tap.i18n
    ----------------------------
    {
        languages_files_dir: "i18n" // the path to your languages files
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
      api.use(['tap-i18n'], ['client']);
    
      .
      .
      .
    
      // You must load your package's package-tap.i18n before you load any
      // template
      api.add_files("package-tap.i18n", ['client']);
    
      // Templates loads (if any)
    
      // List your languages files so Meteor will watch them and rebuild your
      // package as they change
      // You must load the languages files after you loaded your templates -
      // otherwise the templates won't have the i18n capabilities (unless you'll
      // register them with tap-i18n yourself, see below)
      api.add_files([
        "i18n/en.i18n.json",
        "i18n/fr.i18n.json",
        "i18n/pt.i18n.json",
        "i18n/pt-br.i18n.json",
      ], ['client']);
    });

Note: The fact that all the languages files are added in the package.js doesn't
mean that they will all actually be loaded for every single client that uses
your package. We use this listing for two purposes: (1) to be able to watch
these files for changes to trigger rebuild, and (2) to have a mark in the
package loading process in which we know all the templates of the package
are loaded so we can register them with tap-i18n.

### Package Level tap-i18n Functions:

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

### Using tap-i18n in your package templates:

See "The tap-i18n Handlebars helper" section above.

Unit Testing
------------

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

    # tap-i18n package has no translation for the fallback language. Since the
    # build fails for this environment, there are only bash test for it. Break
    # (ctrl+c) after Meteor build fails to run bash tests.
    $ ./unittest/unittest-package_with_no_fallback_language 

    # tap-i18n package has a translation to a dialect but not to its base language.
    # Since the build fails for this environment, there are only bash test for
    # it. Break (ctrl+c) after Meteor build fails to run bash tests.
    $ ./unittest/unittest-package_with_no_base_lang_for_dialect 

Credits
-------

**Libraries:**

* [i18next](http://i18next.com/)
* [wrench-js](https://github.com/ryanmcgrath/wrench-js)

