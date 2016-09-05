
'use strict';



import i18nJsonCompiler from './../compilers/json-i18n';



Plugin.registerCompiler({

    extensions: [ 'i18n.json' ],
    isTemplate: false,

}, ()=>{ return new i18nJsonCompiler(); });
