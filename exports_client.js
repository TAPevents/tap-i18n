
'use strict';



import clientApi from './client/api';
import init from './client/init';
import { addTranslationsByNamespace } from './shared/cache';



export { 
    clientApi as default,
    init as _init,
    addTranslationsByNamespace as _preloadTranslations
};
