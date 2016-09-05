
'use strict';



const CONFIG_DEFAULTS = {
    FALLBACK_LANGUAGE: {
        tag: 'en',
        label: 'English'
    },
    LANGUAGES_TAGS_REGEX: new RegExp(/^[a-z]{2,3}(\-[A-Z]{2})?$/),
    PROJECT_NAMESPACE: 'project',
    INTERNAL_TRANSLATION_FILES_SERVE_PATH: '/tap-i18n',
    ASSETS_FOLDER: 'tap-i18n_translation-assets',
    GLOBAL_TEMPLATE_HELPER_NAME: '_',
    
    DEBUG_MODE: false,
    CACHE_TRANSLATION_FILES_ON_SERVER: false,   // TODO: implement in translation-provider, respect preload flag
    PRELOAD_ALL_LANGUAGES_ON_SERVER: true
};



export { CONFIG_DEFAULTS as default };
