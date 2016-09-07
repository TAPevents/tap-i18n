
'use strict';



import api from './../shared/api';

import i18next from 'i18next'; 

import CONFIG_DEFAULTS from './../shared/etc/config-defaults';
import CACHE from './cache';
import { 
    getLanguage, 
    setLanguage,
    addTranslationOverwrites
} from './../shared/cache';
import fetchTranslations from './lib/translation-fetcher';



const { PROJECT_NAMESPACE } = CONFIG_DEFAULTS;



Object.assign( api, {
    
    // ----> previously existing public API:
    setLanguage( langTag ){
        let language;
        
        try{
            language = setLanguage( langTag );
            if( language === false ){
                return Promise.resolve( 'language already set' );
            }
        }
        catch( exc ){
            return Promise.reject( exc );
        }
        
        
        return fetchTranslations( langTag )
            .then( ()=>{
                CACHE.dependency.changed();
            });
    },    
    
    getLanguage(){
        CACHE.dependency.depend();
        
        const { tag } = getLanguage();
        
        return tag;
    },
    
    
    // @overwrite from shared/ because of the tracker dependency
    // 
    loadTranslations( translations ){
        addTranslationOverwrites( ...arguments );
        
        const { tag } = getLanguage();
        
        Object.keys( translations ).find(( langTag )=>{
            const found = langTag === tag;
            if( found ){
                CACHE.dependency.changed();
            }
            return found;
        });
    },
    // <-----
    
        
  
    
    translate( key, options = {} ){
        CACHE.dependency.depend();
        
        const { tag } = getLanguage();
        
        if( typeof options === 'string' ){
            options = {
                ns: options
            }
        }
        
        Object.assign( options, { lng: tag } );
        return i18next.t( key, options );
    }

});



export { 
    api as default
};
