
'use strict';



import SharedTranslator from './../../shared/lib/translator';

import CACHE from './../cache';
import { getLanguage } from './../../shared/cache';



function Translator( packageName, options ){
    const self = this;
    
    SharedTranslator.call( self, ...arguments );
    
    const { helper_name: templateHelperName } = options;
    
    
    self._templateHelperName = templateHelperName;
    
    
    return self;
}


Translator.prototype = Object.assign( SharedTranslator.prototype, { 
    
    constructor: Translator,
    
    
    _getTemplateHelperName(){
        const self = this;
        return self._templateHelperName;
    },
    
    _getLanguage(){
        CACHE.dependency.depend();
        return getLanguage();
    }
    
});



export { Translator as default }
