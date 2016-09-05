
'use strict';



import { HTTP } from 'meteor/http';

import { 
    obtainTranslationFilesServeEntry as obtainServeEntry,
    getTranslatorsSupportingLanguage as getSupportingTranslators,
    isLanguageAlreadyFetched,
    markLanguageAsFetched
} from './../../shared/cache';



function fetchTranslations( langTag ){
    const translators = getSupportingTranslators( langTag );
    
    if( isLanguageAlreadyFetched( langTag ) ){
        return Promise.resolve();
    }
    
    const requests = translators.map( ( translator )=>{
        const packageName = translator._getPackageName();
        return Promise.all([
            fetchTranslationFile( { langTag, packageName } ),
            Promise.resolve( translator )
        ]);
    });
    
    return Promise.all( requests )
        .then( ( responses )=>{
            const addedTranslations = responses.map( ( [ translations, translator ] )=>{
                translator._addTranslations( langTag, translations );
                
                return {
                    namespace: translator._getNamespace(),
                    translations
                };
            });
            
            markLanguageAsFetched( langTag );
            
            return Promise.resolve();
        });
        // .catch( ( exc )=>{} );
}


function fetchTranslationFile( lang ){
    const { langTag, packageName } = lang;
    
    const url = `${ obtainServeEntry() }/${ packageName }/${ langTag }.i18n.json`;
    
    return new Promise( ( __ful, rej__ )=>{
        
        HTTP.call(
            'GET',
            url,
            {
                headers: {
                    'Accept': 'application/json'
                },
                followRedirects: true
            },
            ( err, res )=>{
                const { 
                    statusCode,
                    content,
                    data,
                    headers
                } = res;
                
                if( typeof err !== 'undefined' && err !== null ){
                    if( statusCode === 404 ){
                        // NOTE: in this case, we try to not break the promise chain
                        return __ful( Object.create( null ) );
                    }else{
                        // NOTE: here something else has happen; good idea to start debugging
                        return rej__( err );
                    }
                }
              
                return __ful( data );
            }
        );
    
    });
}






export {
    fetchTranslations as default
}
