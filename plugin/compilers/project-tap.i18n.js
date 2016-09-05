
'use strict';



import { Match } from 'meteor/check';

import schema from './../schemas/project-tap.i18n';
import { 
    filterProjectTranslationFiles as filterTranslationFiles,
    shouldTranslationGetPreloaded
} from './lib/translation-utils';
import generateCode from './../code-templates/configuration';
import { tagToLanguage } from './../../shared/etc/language-names';



class ProjectTAPi18nCompiler extends CachingCompiler {
    
    constructor(){
        super({
            compilerName: 'project-tap_i18n',
            defaultCacheSize: 1024                  // bytes
        });
    }
    
    
    preprocessContents( inputFile ){
        if( inputFile.constructor.name !== 'InputFile' ){
            const projectFile = inputFile.get( '{}/project-tap.i18n' );
            if( typeof projectFile === 'undefined' ){ 
                const native = schema.clean( Object.create( null ) );
                return { native, json: JSON.stringify( native ) };
            }
            inputFile = projectFile;
        }
        
        const fileContents = inputFile.getContentsAsString();
        
        let native = Object.create( null );
        try {
            native = JSON.parse( fileContents );
        }catch( ex ){
            throw new Error( `file contains invalid json` );
        }
        
        if( !Match.test( native, schema ) ){
            throw new Error( `file contains invalid structure` );
        }
        
        // NOTE: set defaultValues if not defined
        schema.clean( native );
        
        return { native, json: JSON.stringify( native ) };
    }
    

    getCacheKey( inputFile ){
        return [
            inputFile.getSourceHash()
        ];
    }
    
    compileOneFile( inputFile, allFiles ){
        const self = this;
        
        let preprocessedFileContents = Object.create( null );
        try {
            preprocessedFileContents = self.preprocessContents( inputFile );
        }
        catch( exc ){
            inputFile.error( exc );
            return preprocessedFileContents;
        }
        
        const { native, json } = preprocessedFileContents;
        
        const arch = inputFile.getArch().split( '.' ).shift();  // 'web' or 'os'

        if( arch !== 'web'){
            return Object.create( null );
        }
        
        const {
            supported_languages: supportedLangs,
            preloaded_langs: preloadedLangs 
        } = native;
        
        const translationFiles = filterTranslationFiles( 
            allFiles,
            { supportedLangs, preloadedLangs } 
        );
        
        
        const [ availableLanguages, preloadTranslationFiles ] = translationFiles.reduce( 
            ( [ langs, preloads ], fileInfo)=>{
                const { langTag } = fileInfo;
                
                const lang = tagToLanguage( langTag );
                
                if( shouldTranslationGetPreloaded( fileInfo, { preloadedLangs } ) === true ){
                    preloads.push( fileInfo );
                    
                    lang[ langTag ].preloaded = true;
                    lang[ langTag ].fetched = true;
                }
                
                Object.assign( langs, lang );
                
                return [ langs, preloads ];
            }, 
            [ { /* availableLanguages */ }, [ /* preloadTranslationFiles */ ] ] 
        );
        
        Object.assign( native, { availableLanguages } );

        
        const js = generateCode({
            configuration: native,
            preloadTranslationFiles
        });

        const compileResult = { src: { raw: json, js } };
        const referencedImportPaths = [];
        return { compileResult, referencedImportPaths };
    }
    
    compileResultSize( compileResult ){
        return compileResult.source.length;
    }
    
    addCompileResult( inputFile, compileResult ){
        const { src: { js } = {} } = compileResult;
        
        if( typeof js === 'undefined' ){
            return;
        }
        
        const fileName = 'tapi18n.js';
        const path = `${ inputFile.getDirname() }/${ fileName }`;
        const sourcePath = inputFile.getPathInPackage(); 
        
        
        if( typeof js === 'string' ){
            inputFile.addJavaScript({ path, sourcePath, data: js });
        }else if( typeof js === 'object' ){
            const arch = inputFile.getArch().split( '.' ).shift();  // 'web' or 'os'
            const { server, client } = js;
        
            if( typeof server === 'string' && arch === 'os' ){
                inputFile.addJavaScript({ path, sourcePath, data: server });
            }
            
            if( typeof client === 'string' && arch === 'web' ){
                inputFile.addJavaScript({ path, sourcePath, data: client });
            }
            
        }
    }
    
}



export { ProjectTAPi18nCompiler as default };
