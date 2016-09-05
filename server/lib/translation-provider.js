
'use strict';


import { WebApp } from 'meteor/webapp';
import { parse as parseUrl } from 'url';
import fs from 'fs';
import path from 'path';


import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';
import { getTranslationFilesProviderConfiguration as fileProviderConfig } from './../../shared/cache';



const { 
    PROJECT_NAMESPACE,
    ASSETS_FOLDER,
    LANGUAGES_TAGS_REGEX
} = CONFIG_DEFAULTS;



function handler( req, res, next ){
    const { url } = req;
    const { pathname } = parseUrl( url );
    
    const [ packageName, fileName ] = pathname.split( '/' ).slice( -2 );

    const filePath = obtainTranslationFilePath( packageName, fileName );
    
    validateTranslationFileName( fileName )
        .then( ()=> getTranslationFileContent( filePath ) )
        .then( ( fileContent )=>{
            res.writeHead( 
                200,  
                {
                    'Content-Type': 'application/json'
                } 
            );
            res.write( fileContent, 'utf8' );
            res.end();
        })
        .catch( ( err )=>{
            res.writeHead( 
                404,  
                {
                    'Content-Type': 'text/plain'  
                } 
            );
            res.write( 'file not found' );
            res.end();
        });
}


function getTranslationFileContent( filePath ){
    return new Promise( ( __ful, rej__ )=>{
        fs.readFile( filePath, { encoding: 'utf8' }, ( err, fileContent )=>{
            if( typeof err !== 'undefined' && err !== null ){
                return rej__( err );
            }
            return __ful( fileContent );
        });
    });
}


function validateTranslationFileName( fileName ){
    const [ langTag, typeExtension, fileExtension ] = fileName.split( '.' );
    
    if( LANGUAGES_TAGS_REGEX.test( langTag ) === false ){
        return Promise.reject( 'invalid language tag' );
    }
    
    if( typeExtension !== 'i18n' ){
        return Promise.reject( 'invalid extension type' );
    }
    
    if( fileExtension !== 'json' ){
        return Promise.reject( 'invalid file type' );
    }
    
    return Promise.resolve();
}


function obtainTranslationFilePath( packageName, fileName ){
    let assetFolder = `app/`;
    
    if( packageName !== PROJECT_NAMESPACE ){
        assetFolder = `packages/${ packageName }/`;
    }
    
        
    const { __meteor_bootstrap__: { 
        serverDir: serverPath = process.cwd() 
    } = {} } = global;
    
    return path.join( 
        serverPath, 
        'assets',
        assetFolder,
        `${ ASSETS_FOLDER }/${ fileName }`
    );
}





function register( pathPrefix ){
    if( typeof pathPrefix !== 'string' ){
        let { localEntryPath } = fileProviderConfig();
        if( typeof localEntryPath !== 'string' || localEntryPath.trim().length <= 0 ){
            throw new Error( 'no local path route defined for serving translation files' );
        }
        pathPrefix = localEntryPath;
    }

    
    if( pathPrefix.charAt( 0 ) !== '/' ){
        pathPrefix = `/${pathPrefix}`;
    }
    
    if( pathPrefix.charAt( pathPrefix.length - 1 ) === '/' ){
        pathPrefix = pathPrefix.slice( 0, -1 );
    }
    
    
    WebApp.connectHandlers.use( pathPrefix, handler );
}



export { 
    register as default,
    obtainTranslationFilePath,
    getTranslationFileContent
};
