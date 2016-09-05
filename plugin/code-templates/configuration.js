
'use strict';



import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';



const { 
    PROJECT_NAMESPACE
} = CONFIG_DEFAULTS;



function generate( options = {} ){
    
    const { 
        configuration,
        packageName = PROJECT_NAMESPACE,
        preloadTranslationFiles = []
    } = options;
    
    const translationImports = generateTranslationsImportStatements( preloadTranslationFiles );
    
    
    let levelSpecificCode = '';
    
    if( typeof packageName !== 'string' || packageName === PROJECT_NAMESPACE ){
        levelSpecificCode +=    `
                                const translator = initialize( '${ PROJECT_NAMESPACE }', options );
                                const translate = translator.translate.bind( translator );
                                
                                export {
                                    translator as default,
                                    translate,
                                    translate as __
                                };
                                `;
    }else{ // package level
        const { translation_function_name: translateFnName } = configuration;
        levelSpecificCode +=    `
                                const translator = initialize( '${ packageName }', options );
                                const translate = translator.translate.bind( translator );
                                
                                export {
                                    translator as default,
                                    translate,
                                    translate as ${ translateFnName }
                                };
                                `;
    }
    
    const server =  `
                    'use strict';
                
                    import { 
                         _init as initialize
                    } from 'meteor/tap:i18n';
                
                    const options = ${ JSON.stringify( configuration ) };
                    ${ levelSpecificCode }
                    `;
    
    
    const client =  `
                    'use strict';
                
                    import { 
                        _init as initialize
                    } from 'meteor/tap:i18n';
                    
                    const options = ${ JSON.stringify( configuration ) };
                    ${ levelSpecificCode }
                    `;
    
    
    return { server, client };
}


function generateTranslationsImportStatements( files = [] ){
    return files.reduce( ( importsString, path )=>{
        if( typeof path !== 'string' ){
            if( typeof path.path === 'string' ){
                path = path.path;
            }else{
                return importsString;
            }
        }
        
        return `${ importsString }
                import './${ path }';`;
    }, '' );
}



export { generate as default };
