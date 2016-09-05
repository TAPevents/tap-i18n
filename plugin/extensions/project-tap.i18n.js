
'use strict';



import ProjectTAPi18nCompiler from './../compilers/project-tap.i18n';



Plugin.registerCompiler({

    filenames: [ 'project-tap.i18n' ], 
    isTemplate: false

}, ()=>{ return new ProjectTAPi18nCompiler() });
