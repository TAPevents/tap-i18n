
'use strict';



import CONFIG_DEFAULTS from './../../../shared/etc/config-defaults';



const { 
    FALLBACK_LANGUAGE
} = CONFIG_DEFAULTS;



function extractTranslationFileInfo( inputFile ){
    const parts = inputFile.getPathInPackage().split( '.' );
    const extension = parts.pop();
    
    if( extension === 'i18n' ){
        return Object.create( null );
    }

    const path = parts.join( '.' );
    const name = path.split( '/' ).pop();
    const langTag = name.split( '.' ).shift();
    
    return {
        name,
        extension,
        langTag,
        lang: langTag.split( '-' ).shift(),
        path,
        packageName: inputFile.getPackageName()
    };
}


function shouldTranslationGetCompiled( fileInfo, options = {} ){
    
    const {
        langTag
    } = fileInfo;
    const {
        supportedLangs,
    } = options;
    

    if( supportedLangs !== null && supportedLangs.indexOf( langTag ) < 0 ){
        return false;
    }

    return true;
}


function shouldTranslationGetPreloaded( fileInfo, options = {} ){
    const {
        langTag
    } = fileInfo;
    const {
        preloadedLangs
    } = options;
    

    if( preloadedLangs[0] === '*' ){
        return true;
    }
    
    if( preloadedLangs.indexOf( langTag ) > -1 ){
        return true;
    }
    
    if( preloadedLangs.length <= 0 && langTag === FALLBACK_LANGUAGE.tag ){
        return true;
    }

    return false;
}


function filterProjectTranslationFiles( allFiles, options = {} ){
    const { supportedLangs, preloadedLangs } = options;
    
    return Array.from( allFiles.keys() ).reduce(( translationFiles, filePath )=>{
        const inputFile = allFiles.get( filePath );
        
        // NOTE: here we only need translations defined in project-level
        if( inputFile.getPackageName() !== null ){
            return translationFiles;
        }
        
        const translationFileInfo = extractTranslationFileInfo( inputFile );
        const {
            name,
            extension,
            packageName,
            path,
            langTag
        } = translationFileInfo;
        
        
        // NOTE: here we know it's no translation/i18n file
        if( typeof extension === 'undefined' ){
            return translationFiles;
        }
        
        const isRequired = shouldTranslationGetCompiled( translationFileInfo, options );
        if( isRequired === false ){
            return translationFiles;
        }
        
        
        translationFiles.push( { path, langTag } );
        
        return translationFiles;
    }, [ /* translationFiles */ ] );
}


function filterPackageTranslationFiles( allFiles, options = {} ){
    const { packageName, supportedLangs, preloadedLangs } = options;
    
    return Array.from( allFiles.keys() ).reduce(( translationFiles, filePath )=>{
        const inputFile = allFiles.get( filePath );
    
        // NOTE: here we only need translations in given package name
        // NOTE: returns also at this point if packageName is undefined
        if( inputFile.getPackageName() !== packageName ){
            return translationFiles;
        }
        
        const translationFileInfo = extractTranslationFileInfo( inputFile );
        const {
            extension,
            path,
            langTag
        } = translationFileInfo;
        
    
        // NOTE: here we know it's no translation/i18n file
        if( typeof extension === 'undefined' ){
            return translationFiles;
        }
        

        const isRequired = shouldTranslationGetCompiled( translationFileInfo, options );
        if( isRequired === false ){
            return translationFiles;
        }
        
        
        translationFiles.push( { path, langTag } );
        
        return translationFiles;
    }, [ /* translationFiles */ ] );
}


export {
    extractTranslationFileInfo,
    shouldTranslationGetCompiled,
    shouldTranslationGetPreloaded,
    
    filterProjectTranslationFiles,
    filterPackageTranslationFiles
}
