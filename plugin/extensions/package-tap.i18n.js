
'use strict';



import PackageTAPi18nCompiler from './../compilers/package-tap.i18n';



Plugin.registerCompiler({

    filenames: [ 'package-tap.i18n' ], 
    isTemplate: false

}, ()=>{ return new PackageTAPi18nCompiler() });
