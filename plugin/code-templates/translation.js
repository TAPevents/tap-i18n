
'use strict';



import CONFIG_DEFAULTS from './../../shared/etc/config-defaults';



const { 
    PROJECT_NAMESPACE,
    FALLBACK_LANGUAGE
} = CONFIG_DEFAULTS;



function generate( options = {} ){
    
    const { 
        langTag = FALLBACK_LANGUAGE.tag, 
        namespace = PROJECT_NAMESPACE,
        translations = {}
    } = options; 
    
    const src = `
        'use strict';
        
        import './tapi18n';
        import { _preloadTranslations as preload } from 'meteor/tap:i18n';
        
        const langTag = '${ langTag }';
        const namespace = '${ namespace }';
        const translations = ${ JSON.stringify( translations ) };
                
        preload( translations, langTag, namespace );
        `;
    
    
    return src;
}



export { generate as default };
