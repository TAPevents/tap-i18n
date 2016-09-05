
'use strict';



import CONFIG_DEFAULTS from './../shared/etc/config-defaults';
import CACHE from './../shared/cache';
import Translator from './lib/translator';
import { 
    getTranslator, 
    getTranslatorByNamespace,
    addTranslator, 
    setConfigurations,
    getLanguages,
    markLanguageAsFetched
} from './../shared/cache';



const { 
    PROJECT_NAMESPACE,
    PRELOAD_ALL_LANGUAGES_ON_SERVER
} = CONFIG_DEFAULTS;



Object.assign( CACHE, {
  
    
});



function initializeTranslator( packageName, options = {} ){
    
    
    const existingTranslator = getTranslator( packageName );
    if( typeof existingTranslator !== 'undefined' ){
        return existingTranslator;
    }
    
    let existingNamespaceTranslator;
    const { namespace } = options;
    if( typeof namespace === 'string' ){
        existingNamespaceTranslator = getTranslatorByNamespace( namespace );
    }
    
    
    if( packageName === PROJECT_NAMESPACE ){
        setConfigurations( options );
        
        if( PRELOAD_ALL_LANGUAGES_ON_SERVER === true ){
            const availableLanguages = getLanguages();
            Object.keys( availableLanguages ).forEach( ( langTag )=>{
                markLanguageAsFetched( langTag );
            });
        }
    }

    
    let translator;
    if( typeof existingNamespaceTranslator !== 'undefined' ){
        translator = new Translator( packageName, options, existingNamespaceTranslator );
    }else{
        translator = new Translator( packageName, options );
    }
    
    addTranslator( translator );
    return translator;
}






export { 
    CACHE as default,
    initializeTranslator
};
