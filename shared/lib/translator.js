
'use strict';



import i18next from 'i18next';

import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';
import { getLanguage } from './../../shared/cache';



const { 
    PROJECT_NAMESPACE,
    FALLBACK_LANGUAGE,
    DEBUG_MODE
} = CONFIG_DEFAULTS;



function Translator( packageName = PROJECT_NAMESPACE, options = {}, originTranslator ){
    const self = this;
    
    
    if( typeof packageName === 'object' ){
        options = packageName;
        packageName = PROJECT_NAMESPACE;
    }
    
    if( typeof packageName !== 'string' ){
        throw new Error( 'invalid argument: packageName' );
    }
    
    
    packageName = packageName.replace( ':', '_' );
    self._packageName = packageName;

    
    self._overwrites = {};
    
    self._promises = [];
    
    
    let { namespace = packageName } = options;
    if( namespace === null ){
        namespace = packageName;
        Object.assign( options, { namespace } );
    }
    
    
    // INHERIT from origin translator
    if( typeof originTranslator !== 'undefined' ){
        self._namespace = originTranslator._namespace;
    }else{
        self._namespace = namespace;
    }
    
    
    const { availableLanguages } = options;
    
    self._supportedLangauges = new Map( 
        Object.keys( availableLanguages ).map( ( langTag )=>{
            return [
                langTag,
                availableLanguages[ langTag ]
            ]
        }) 
    );

    
    // INHERIT from origin translator
    if( typeof originTranslator !== 'undefined' ){
        self._i18next = originTranslator._i18next;
        self._promises.push( ...originTranslator._promises );
    }else{
        const i18nextOptions = {
            resources: Object.create( null ),
            fallbackLng: FALLBACK_LANGUAGE.tag,
            defaultNS: namespace,
            debug: DEBUG_MODE
        };
        const i18nextIsReady = new Promise( ( __ful, rej__ )=>{
            self._i18next = i18next.createInstance( i18nextOptions, ( err, t )=>{
                if( typeof err !== 'undefined' && err !== null ){
                    return rej__( err );
                }
                return __ful( t );
            });
        });
        self._promises.push( i18nextIsReady );
    }

    
    return self;
}


Object.assign( Translator.prototype, {
    
    constructor: Translator,
    
    
    _getNamespace(){
        const self = this;
        return self._namespace;
    },
    
    _getPackageName(){
        const self = this;
        return self._packageName;
    },
    
    _getLanguage: getLanguage,
    
    _supportsLanguage( langTag ){
        const self = this;
        return self._supportedLangauges.has( langTag );
    },
    
    
    // NOTE: might be a good idea to remove resolved promise instances 
    // to reduce memory footprint
    ifReady(){
        const self = this;
        return Promise.all( self._promises );
    },
        
    
    _addTranslations( langTag, translations ){
        if( typeof translations !== 'object' ){
            throw new Error( 'invalid argument: translations' );
        }

        const self = this;
        
        
        const {
            [ langTag ]: translationOverwrites = {}
        } = self._overwrites;
        
        Object.assign( translations, translationOverwrites );
        
        
        const deep = true;
        const overwrite = true;
        
        self._i18next.addResourceBundle(
            langTag, 
            self._namespace,
            translations,
            deep,
            overwrite
        );
    },
    
    _getTranslations( langTag ){
        const self = this;
        
        const { 
            services: { 
                resourceStore: { 
                    data: { 
                        [ langTag ]: translations = {} 
                    } = {} 
                } = {} 
            } = {}
        } = self._i18next;
        
        return {
            namespace: self._namespace,
            translations
        }
    },
    
    
    _addOverwrites( langTag, translations ){
        if( typeof translations !== 'object' ){
            throw new Error( 'invalid argument: translations' );
        }
        
        const self = this;
        
        
        const { [ langTag ]: existingOverwrites = {} } = self._overwrites;
        self._overwrites[ langTag ] = Object.assign( existingOverwrites, translations );
    },
    
    
    translate( key, langTag ){
        const self = this;
        
        if( typeof langTag !== 'string' ){
            const { tag } = self._getLanguage();
            langTag = tag;
        }
        
        const namespace = self._namespace;
        
        return self._i18next.t( key, { lng: langTag, ns: namespace } );
    },
    
    __(){
        const self = this;
        return self.translate( ...arguments );
    }
    
});



export { Translator as default }
