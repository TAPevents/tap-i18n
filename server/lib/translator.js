
'use strict';



import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';
import {
    obtainTranslationFilePath,
    getTranslationFileContent
} from './translation-provider';

import SharedTranslator from './../../shared/lib/translator';



const { PRELOAD_ALL_LANGUAGES_ON_SERVER } = CONFIG_DEFAULTS;



function Translator( /* arguments */ ){
    const self = this;
    
    SharedTranslator.call( self, ...arguments );
    
    if( PRELOAD_ALL_LANGUAGES_ON_SERVER === true ){
        // NOTE: this is currently only possible because, here we are on the server where 
        // translations files (e.g. en.i18n.json) are available only as json assets, but
        // wont get build into js files like for the client
        const importsDone = self._importAllTranslationsFromFiles();
        self._promises.push( importsDone );
    }
    
    
    return self;
}


Translator.prototype = Object.assign( SharedTranslator.prototype, {
    
    constructor: Translator,
    
    
    _readTranslationFileContents( langTag ){
        const self = this;
        
        if( self._supportedLangauges.has( langTag ) === false ){
            return Promise.reject( new Error( `unsupported language: ${ langTag }` ) );
        }
        
        const fileName = `${ langTag }.i18n.json`;
        const packageName = self._getPackageName();
        
        const translationFilePath = obtainTranslationFilePath( packageName, fileName );
        
        return getTranslationFileContent( translationFilePath );
    },
    
    _importAllTranslationsFromFiles(){
        const self = this;
        
        const langTags = Array.from( self._supportedLangauges.keys() );
        
        const translationsFilesReaders = langTags.map( ( langTag )=>{ 
            return Promise.all([
                Promise.resolve( langTag ),
                self._readTranslationFileContents( langTag )
            ]);
        });

        return Promise
                .all( translationsFilesReaders )
                .then( ( translationFilesContents )=>{
                    translationFilesContents.map( ( [ langTag, translationFileContents ] )=>{
                        if( typeof translationFileContents === 'string' ){
                            translationFileContents = JSON.parse( translationFileContents );
                        }
                        
                        self._addTranslations( langTag, translationFileContents );
                        
                        return [ langTag, translationFileContents ];
                    });
                    
                    return Promise.resolve( translationFilesContents );
                });
                // .catch( ( exc )=> console.log( exc ) );
    }
    
    
});



export { Translator as default }
