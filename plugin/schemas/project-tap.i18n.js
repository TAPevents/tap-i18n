'use strict';


import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';



const {
    INTERNAL_TRANSLATION_FILES_SERVE_PATH,
    GLOBAL_TEMPLATE_HELPER_NAME
} = CONFIG_DEFAULTS;


const supportedLangs = null;
const preloadedLangs = [];
const serveEntry = INTERNAL_TRANSLATION_FILES_SERVE_PATH;
const cdnPath = null;




const schema = new SimpleSchema({
    helper_name: {
        type: String,
        label: 'Helper Name',
        defaultValue: GLOBAL_TEMPLATE_HELPER_NAME,
        optional: true
    },
    
    supported_languages: {
        type: [ String ],
        label: 'Supported Languages',
        defaultValue: supportedLangs,
        optional: true
    },
    preloaded_langs: {
        type: [ String ],
        label: 'Preload languages',
        defaultValue: preloadedLangs,
        optional: true
    },
    
    i18n_files_route: {
        type: String,
        label: 'Unified languages files path',
        defaultValue: serveEntry,
        optional: true
    },
    cdn_path: {
        type: String,
        label: 'Unified languages files path on CDN',
        defaultValue: cdnPath,
        optional: true
    }
});



export { schema as default, CONFIG_DEFAULTS };
