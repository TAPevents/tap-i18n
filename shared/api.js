
'use strict';



import i18next from 'i18next';

import CONFIG_DEFAULTS from './etc/config-defaults';
import { 
    addTranslations, 
    getTranslator,
    getLanguages,
    addTranslationOverwrites,
    allTranslatorsWhoMightBeReady
} from './cache';



const { 
    PROJECT_NAMESPACE
} = CONFIG_DEFAULTS;



const api = {
    
    i18next,
    
    
    // ----> previously existing public API:
    addResourceBundle( langTag, packageName, translations ){
        addTranslations( langTag, packageName, translations );
    },
    
    
    getLanguages,
    
    
    loadTranslations: addTranslationOverwrites,
    
    
    __(){
        const translator = getTranslator( PROJECT_NAMESPACE );
        if( typeof translator !== 'object' ){
            throw Error( 'tap:i18n not installed in project level' );
        }
        
        return translator.translate( ...arguments );
    },
    // <-----
    
        
    isReady(){
        return Promise.all( allTranslatorsWhoMightBeReady() );
    }
    
};



export { api as default };
