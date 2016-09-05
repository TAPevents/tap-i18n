
'use strict';



import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';
import ProjectTAPi18nCompiler from './project-tap.i18n';
import PackageTAPi18nCompiler from './package-tap.i18n';
import { 
    extractTranslationFileInfo, 
    shouldTranslationGetCompiled,
    shouldTranslationGetPreloaded
} from './lib/translation-utils';
import generateCode from './../code-templates/translation';



const { preprocessContents: preprocessProjectContents } = ProjectTAPi18nCompiler.prototype;
const { preprocessContents: preprocessPackageContents } = PackageTAPi18nCompiler.prototype;
const { ASSETS_FOLDER } = CONFIG_DEFAULTS;



class i18nCompiler extends CachingCompiler {
    
    constructor( { compilerName = 'i18n' } = {} ) {
        super({
            compilerName,
            defaultCacheSize: 1024 * 1024 * 10            // bytes
        })
    }
    
    
    getCacheKey( inputFile ){
        return [
            inputFile.getSourceHash()
        ];
    }
    
    compileResultSize( compileResult ){
        return compileResult.source.length;
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
        
        const { native, raw } = preprocessedFileContents;

        const translationFileInfo = extractTranslationFileInfo( inputFile );
        const {
            langTag,
            packageName,
            path
        } = translationFileInfo;

        const projectConfig = preprocessProjectContents( allFiles );
        const { 
            native: {
                supported_languages: supportedLangs,
                preloaded_langs: preloadedLangs,
                cdn_path: cdnPath
            } = {} 
        } = projectConfig;
        
        const shouldGetCompiled = shouldTranslationGetCompiled( 
            translationFileInfo, 
            {
                supportedLangs
            }
        );
        
        const shouldGetPreloaded = shouldTranslationGetPreloaded( 
            translationFileInfo, 
            {
                preloadedLangs
            }
        );


        const src = Object.create( null );

        if( shouldGetCompiled ){
            let namespace;
            
            if( packageName !== null ){
                const { native: { namespace: ns } } = preprocessPackageContents( allFiles, packageName );
                namespace = ns;
            }
            
            src.raw = raw;
            
            if( shouldGetPreloaded ){
                src.js = generateCode({
                    langTag,
                    namespace,
                    translations: native
                });
            }
        }


        const compileResult = { src, fileInfo: translationFileInfo, cdnPath };
        const referencedImportPaths = [];
        return { compileResult, referencedImportPaths };
    }

    
    addCompileResult( inputFile, compileResult ){
        const { src: { raw, js }, fileInfo, cdnPath } = compileResult;
        const {
            name, 
            extension,
            path 
        } = fileInfo;

        const arch = inputFile.getArch().split( '.' ).shift();  // 'web' or 'os'


        if( arch === 'web' && typeof js !== 'undefined'){
            inputFile.addJavaScript({
                path: `/${ name }.js`,
                sourcePath: inputFile.getPathInPackage(),
                data: js
            });
        }

        if( arch === 'os' && cdnPath === null && typeof raw !== 'undefined' ){
            inputFile.addAsset({
                path: `${ ASSETS_FOLDER }/${ name }.json`,
                data: raw 
            });
        }
    }
}



export { i18nCompiler as default };
