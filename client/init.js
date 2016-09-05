
'use strict';



import { initializeTranslator } from './cache';
import { registerTemplateHelper } from './lib/template-utils';



function init( packageName, options ){
    const translator = initializeTranslator( packageName, options );
    
    
    registerTemplateHelper( translator );
    
    
    return translator;
}



export { init as default };
