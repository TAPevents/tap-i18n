
'use strict';



import { Tracker } from 'meteor/tracker';

import CACHE from './../shared/cache';
import Translator from './lib/translator';
import { 
    getTranslator, 
    addTranslator, 
    setConfigurations, 
    getTranslatorByNamespace 
} from './../shared/cache';
import CONFIG_DEFAULTS from './../shared/etc/config-defaults';



const { 
    PROJECT_NAMESPACE: PROJECT_NAMESPACE
} = CONFIG_DEFAULTS;



Object.assign( CACHE, {
  
    dependency: new Tracker.Dependency()
    
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
