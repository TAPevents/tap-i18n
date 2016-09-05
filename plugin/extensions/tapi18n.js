
'use strict';



import TAPi18nCompiler from './../compilers/tapi18n';



Plugin.registerCompiler({

    extensions: [ 'i18n.json', 'i18n.yml' ],
    filenames: [ 'project-tap.i18n', 'package-tap.i18n' ], 
    isTemplate: false
    
    // NOTE: value can only be a String, no Array    
    // 'web' == client/browser, 'os' == server
    // archMatching: 'web'

}, ()=>{ return new TAPi18nCompiler() });
