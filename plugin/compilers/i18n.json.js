
'use strict';



import minifyJSON from 'node-json-minify';

import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';
import i18nCompiler from './i18n';



const { PROJECT_NAMESPACE } = CONFIG_DEFAULTS;



class i18nJsonCompiler extends i18nCompiler {
    
    constructor() {
        super({
            compilerName: 'i18n_json',
        })
    }
    
    
    preprocessContents( inputFile ){
        const fileContents = minifyJSON( inputFile.getContentsAsString() );
        
        let native = Object.create( null );
        try {            
            native = JSON.parse( fileContents );
        }catch( ex ){
            throw new Error( `language file contains invalid json` );
        }
        
        return { native, raw: fileContents };
    }
    
}



export { i18nJsonCompiler as default };
