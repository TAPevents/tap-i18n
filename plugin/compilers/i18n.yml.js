
'use strict';



import YAML from 'yamljs';

import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';
import i18nCompiler from './i18n';



const { PROJECT_NAMESPACE } = CONFIG_DEFAULTS;



class i18nYamlCompiler extends i18nCompiler {
    
    constructor() {
        super({
            compilerName: 'i18n_yaml'
        })
    }
    
    
    preprocessContents( inputFile ){
        const fileContents = JSON.stringify( YAML.parse( inputFile.getContentsAsString() ) );
        
        let native = Object.create( null );
        try {
            native = JSON.parse( fileContents );
        }catch( ex ){
            throw new Error( 'language file contains invalid yaml' );
        }
        
        return { native, raw: fileContents };
    }

}



export { i18nYamlCompiler as default };
