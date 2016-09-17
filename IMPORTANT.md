
Notes about the 2.0 major refactoring
=====================================


__*IMPORTANT: This is a full rewrite. It still has no testing (TODO: make use of the new 
[test integration](https://guide.meteor.com/testing.html)).*__ 


The goal was to make tap:i18n work again in meteor v 1.3 and above. In order to do that, the new
Build Plugin API, introduced in meteor v1.2, has to be used. Also it heavily uses *ES6 Modules* 



### Things that changed

+   required meteor version: latest 1.3
+   makes use of meteors new [Build Plugin API](https://docs.meteor.com/api/packagejs.html#build-plugin-api)
+   removed dependencies:
    -   `raix:eventemitter`
    -   `meteorspark:util`
    -   `cfs:http-methods`
    -   `coffeescript` (rewrite in JS)
+   `tap:i18n` should be imported in the following ways:

    ```javascript
    // PROJECT level
    import { translate as __ } from '/tapi18n';
    import TAPi18n from 'meteor/tap:i18n';

    // PACKAGE level (in file /client/ui/page.js)
    import { translate as __ } from './../../tapi18n';  // NOTE: 'tapi18n' is located in level root
    import TAPi18n from 'meteor/tap:i18n'
    
    
    // and can then be used as normal
    TAPi18n.setLanguage( 'es' );
    console.log( __( 'key.to.error-message' [, languageTag ] ) );
    ```
    
+   all translations (whether its related to a package or project ) for a certain language 
    wont be fetched from the server as one json bundle anymore. Now they are come independently
    for every translator (TODO: move that fetch and add logic into the `Translator`)
    
+   added some flags in the default configurations

+   (and maybe some other, which I might not be aware of)

+   `package-tap.i18n` doesnt have to get loaded before all `...i18n.json` files - it simply doesnt
    matter - the build tool and the compiled files will take care of that
    
+   translations dont get cached twice (within a `tap:i18n` package level and within `ì18next`) 
    anymore
    
+   `TAPi18n.isReady()` returns a `Promise` and should be used at least on the server, before 
    translating anything. Remember, there is no `Tracker` on the server. At the moment on the 
    server all translations will be imported during startup. So they are available only after
    this has finished. And keep in mind all that is also contained in the app's footprint.
    
+   the first statement to import `tapi18n` (see above) also instantiates the level-specific 
    (and also namespace-specific) translator, thus `TAPi18n` and the API should be used afterwards,
    otherwise one might end up getting wrong (or at that point non existing) data



### Things that didnt change

+   still working with both config files (removed deprecated fields)

+   `TAPi18n` is still the same; the `__` function will only translate based on project resources

+   `template_helper` in package, when it has the same name as the one in the project, never worked
    and still dont work, because `Template.registerHelper` is global. It will always try to 
    translate based on the project resources
    
+   (and maybe some other, which I might not be aware of)

+   hopefully every feature still exists



### Things worth knowing

+   not all compilers are currently used in a stand alone way, but could be. In order to be able to
    have all configuration information during build time, it had to be just one compiler 
    (`[extensions, compilers]/tapi18n.js`). So for the sake of DYI, parts of every other 
    compiler are used in the `tap_i18n`-compiler
    
+   every level now has its own `Translator` instance, which facilitates an i18next instance and its
    resource store
    
+   `project-tap.i18n` and `package-tap.i18n` are getting build to `tapi18n.js` and placed 
    in the __root__ of their level (project or package)
+   every translation file will be placed on the server as is and if a certain language should be
    preloaded it also gets compiled to a js module and adds it containg translations to the right
    translator
+   have a look into `/plugin/code-templates` for more infos on what these files are exporting

+   `cfs:http-methods` got replaced by an internally written file server, see 
    `/server/lib/translation-provider.js` (same solution, but got rid of that package dependency)
    
+   the current language state is maintained only by the `tap:i18n`s internal package cache and 
    gets set on every translation in the `options` argument
    
+   i18next is used almost only as a resource/translation store and of cause translating based 
    on these
