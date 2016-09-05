
'use strict';



import i18nYamlCompiler from './../compilers/yaml-i18n';



Plugin.registerCompiler({

    extensions: [ 'i18n.yml' ],
    isTemplate: false

}, ()=>{ return new i18nYamlCompiler() });
