
'use strict';



import CONFIG_DEFAULTS from './../shared/etc/config-defaults';
import { initializeTranslator } from './cache';
import registerTranslationServer from './lib/translation-provider';
import { getTranslationFilesProviderConfiguration as fileProviderConfig } from './../shared/cache';



const { 
    PROJECT_NAMESPACE,
} = CONFIG_DEFAULTS;



function init( packageName, options ){
    const translator = initializeTranslator( packageName, options );
    
    
    if( packageName === PROJECT_NAMESPACE ){
        const { localEntryPath } = fileProviderConfig();
        if( typeof localEntryPath === 'string' && localEntryPath.trim().length >0 ){
            registerTranslationServer( localEntryPath );    
        }
    }
    
    
    return translator;
}


export { init as default };
