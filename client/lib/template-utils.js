
'use strict';


import { Template } from 'meteor/templating';

import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';
import api from './../api';



const { 
    PROJECT_NAMESPACE,
    GLOBAL_TEMPLATE_HELPER_NAME
} = CONFIG_DEFAULTS;



function registerTemplateHelper( translator, templateName ){
    const packageName = translator._getPackageName();
    const translateFn = translator.translate.bind( translator );
    const templateHelperName = translator._getTemplateHelperName();

    
    if( packageName === PROJECT_NAMESPACE ){
        Template.registerHelper( 'languageTag', api.getLanguage );
        Template.registerHelper( templateHelperName, translateFn );
    }else{
        if( templateHelperName !== GLOBAL_TEMPLATE_HELPER_NAME ){
            Template.registerHelper( templateHelperName, translateFn );
        }
    }
    
    
    // NOTE: currently not used
    if( typeof templateName !== 'undefined' ){
        if( typeof templateName !== 'string' ){
            throw new Error( 'invalid argument: template' );
        }
        
        const template = Template[ templateName ];
        if( typeof template !== 'undefined' ){
            template.helpers({
               [ templateHelperName ]: proxyFn 
            });
        }
    }
}



export { registerTemplateHelper };
