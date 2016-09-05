
'use strict';



import { Match } from 'meteor/check';
import CONFIG_DEFAULTS from './etc/config-defaults';



const {
    FALLBACK_LANGUAGE,
    LANGUAGES_TAGS_REGEX,
    PROJECT_NAMESPACE
} = CONFIG_DEFAULTS;



const CACHE = {
    
    configurations: {
        availableLanguages: Object.create( null ),
        // [ langTag ]: {
        //      name: 'English',
        //      [ FALLBACK_LANGUAGE ]: 'English',
        //      fetched: Boolean     // default: undefined || false
        //      preloaded: Boolean   // default: undefined || false
        //  }
        translationFilesProvider: Object.create( null ),
        //  localEntryPath: String,
        //  // OR
        //  // gets prepended to /packageName/langTag.json
        //  cdnEntryUrl: String
        
    },
    
    language: Object.assign( Object.create( null ), FALLBACK_LANGUAGE ),
    //  label: String,
    //  tag: String
    
    overwrites: Object.create( null ),
    //  [ langTag ]: {
    //     [ namespace ]: {
    //          translations
    //          ...
    //     }
    //  }
    
    translators: new Map()
    //  [ packageName ]: Translator

};



function setConfigurations( options = {} ){
    const {
        availableLanguages,
        i18n_files_route,
        cdn_path,
        preloaded_langs,
        supported_languages = []
    } = options;
    
    
    const translationFilesProvider = Object.create( null );
    
    if( typeof i18n_files_route === 'string' && i18n_files_route.trim().length > 0 ){
        Object.assign( translationFilesProvider, {
            localEntryPath: i18n_files_route   
        });
    }else if( typeof cdn_path === 'string' && cdn_path.trim().length > 0 ){
        Object.assign( translationFilesProvider, {
            cdnEntryUrl: cdn_path   
        });
    }
    
    preloaded_langs.forEach( ( langTag )=>{
        const language = availableLanguages[ langTag ];
        if( typeof language === 'object' ){
            language.fetched = true;
        }
    });
    
    Object.assign( CACHE.configurations, { 
        availableLanguages,
        translationFilesProvider
    });
    
    
    const initialLangTag = supported_languages.shift();
    const { name: label } = availableLanguages[ initialLangTag ];
    setLanguage( { tag: initialLangTag, label } );
    
    
    return CACHE.configurations;
}


function getConfigurations(){
    const { configurations = {} } = CACHE;
    return configurations;
}


function getTranslationFilesProviderConfiguration(){
    const { translationFilesProvider: providerConfigs = {} } = getConfigurations();
    return providerConfigs;
}


// @return  {String}    begins with a slash or with protocol, ends with no slash
//
function obtainTranslationFilesServeEntry(){
    const { 
        localEntryPath,
        cdnEntryUrl 
    } = getTranslationFilesProviderConfiguration();
    
    let entryPath = localEntryPath;
    
    if( cdnEntryUrl === 'string' && cdnEntryUrl.trim().length > 0 ){
        entryPath = cdnEntryUrl;
    }else{
        if( entryPath.charAt( 0 ) !== '/' ){
            entryPath = `/${entryPath}`;
        }
    }
    
    if( entryPath.charAt( entryPath.length - 1 ) === '/' ){
        entryPath = entryPath.slice( 0, -1 );
    }
    
    return entryPath;
}



function addTranslator( translator ){
    const packageName = translator._getPackageName();
    
    const existingTranslator = getTranslator( packageName );
    if( typeof existingTranslator !== 'undefined' ){
        console.log( '[WARNING] translator already exists' );
        return existingTranslator;
    }
        
    CACHE.translators.set( packageName, translator );
    return translator;
}


function getTranslator( packageName ){
    packageName.replace( ':', '_' );
    return CACHE.translators.get( packageName );
}


function getAllTranslators(){
    return Array.from( CACHE.translators.values() )
}


function allTranslatorsWhoMightBeReady(){
    return getAllTranslators().map( ( translator )=>{
        return translator.ifReady();
    });
}


function getTranslatorByNamespace( namespace ){
    return getAllTranslators()
                .find( ( translator )=>{
                    // NOTE: should only be one or none in the array
                    return translator._getNamespace() === namespace;
                });
}


function getTranslatorsSupportingLanguage( langTag ){
    return getAllTranslators()
                .filter( ( translator )=>{
                    // NOTE: should only be one or none in the array
                    return translator._supportsLanguage( langTag );
                });
}



function addTranslations( translations, langTag = getLanguageTag(), packageName = PROJECT_NAMESPACE ){
    if( typeof translations !== 'object' || translations === null ){
        throw new Error( 'invalid argument: translations' );
    }
    
    
    const translator = getTranslator( packageName );
    if( typeof translator === 'undefined' ){
        // translator = new Translator( packageName, { /* TODO */ } );
        // addTranslator( translator );
        // OR
        throw new Error( `Translator for package: ${ packageName } does not exist. Translation can't get applied` );
    }
    
    translator._addTranslations( langTag, translations );
    return translator;
}


function addTranslationsByNamespace( translations, langTag = getLanguageTag(), namespace = PROJECT_NAMESPACE ){
    if( typeof translations !== 'object' || translations === null ){
        throw new Error( 'invalid argument: translations' );
    }
    
    
    const translator = getTranslatorByNamespace( namespace );
    if( typeof translator === 'undefined' ){
        // translator = new Translator( packageName, { /* TODO */ } );
        // addTranslator( translator );
        // OR
        throw new Error( `Translator for namespace ${ namespace } does not exist. Translation can't get applied` );
    }
    
    translator._addTranslations( langTag, translations );
    return translator;
}


function addTranslationOverwrites( translations = {}, namespace = PROJECT_NAMESPACE ){
    const packageName = namespace.replace( ':', '_' );
    
    Object.keys( translations ).forEach(( langTag )=>{
        const translation = translations[ langTag ];
        
        const translator = getTranslator( packageName );
        if( typeof translator === 'undefined' ){
            throw new Error( `overwrites cant get applied, translator for ${ namespace } does not exist` );
        }
        
        translator._addOverwrites( langTag, translation );
    });
}



function setLanguage( langTag ){
    const { tag: currentLangTag } = getLanguage();
    if( langTag === currentLangTag ){
        return false;
    }
    
    if( Match.test( langTag, { tag: String, label: String } )
            && LANGUAGES_TAGS_REGEX.test( langTag.tag ) ){
        return Object.assign( CACHE.language, langTag );
    }else if( typeof langTag !== 'string' ){
        throw new Error( 'invalid argument: langTag' );
    }

    const { [ langTag ]: language } = getLanguages();
    
    if( typeof language === 'undefined' ){
        throw new Error( 'unsupported language' );
    }
    
    const { name: label } = language;
    Object.assign( CACHE.language, { tag: langTag, label } );
    return CACHE.language;
}


function getLanguage(){
    const { language } = CACHE;
    return language;
}


function getLanguageTag(){
    const { tag } = getLanguage();
    return tag;
}


function getLanguages(){
    const { availableLanguages } = getConfigurations();
    return availableLanguages;
}


function isLanguageAlreadyFetched( langTag ){
    const { 
        [ langTag ]: { fetched = false } = {}
    } = getLanguages();
    
    return fetched;
}


function markLanguageAsFetched( langTag ){
    const { 
        [ langTag ]: language 
    } = getLanguages();
    
    if( typeof language !== 'object' ){
        return false;
    }
    
    Object.assign( language, { fetched: true } );
}




export {
    CACHE as default,

    setConfigurations,
    getConfigurations,
    getTranslationFilesProviderConfiguration,
    obtainTranslationFilesServeEntry,
    
    getTranslator,
    allTranslatorsWhoMightBeReady,
    getTranslatorByNamespace,
    addTranslator,
    getTranslatorsSupportingLanguage,

    addTranslations,
    addTranslationsByNamespace,
    addTranslationOverwrites,

    setLanguage,
    getLanguage,
    getLanguages,
    isLanguageAlreadyFetched,
    markLanguageAsFetched
}
