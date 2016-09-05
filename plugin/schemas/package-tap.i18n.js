'use strict';


import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';



const {
    GLOBAL_TEMPLATE_HELPER_NAME
} = CONFIG_DEFAULTS;


const translationFn = '__';
const namespace = null;



const schema = new SimpleSchema({
    
    // NOTE: deprecated since meteor >= 1.3 support, because we are using module imports and 
    // their aliasing syntax
    translation_function_name: {
        type: String,
        label: 'Translation Function Name',
        defaultValue: translationFn,
        optional: true
    },
    
    helper_name: {
        type: String,
        label: 'Helper Name',
        defaultValue: GLOBAL_TEMPLATE_HELPER_NAME,
        optional: true
    },
    
    namespace: {
        type: String,
        label: 'Translations Namespace',
        defaultValue: namespace,
        optional: true
    }
});



export { schema as default };
