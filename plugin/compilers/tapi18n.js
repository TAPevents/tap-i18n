
'use strict';



import { BabelCompiler } from 'meteor/babel-compiler';


import ProjectTAPi18nCompiler from './project-tap.i18n';
import PackageTAPi18nCompiler from './package-tap.i18n';
import i18nJsonCompiler from './i18n.json';
import i18nYamlCompiler from './i18n.yml';



const compilers = {
    'project-tap.i18n': new ProjectTAPi18nCompiler(),
    'package-tap.i18n': new PackageTAPi18nCompiler(),
    'i18n.json': new i18nJsonCompiler(),
    'i18n.yml':  new i18nYamlCompiler()
};



class TAPi18nCompiler extends MultiFileCachingCompiler {
    
    constructor(){
        super({
            compilerName: 'tap_i18n',
            defaultCacheSize: 1024 * 1024 * 10      // bytes
        });
        
        this.babelCompiler = new BabelCompiler({
            runtime: false
        });
    }
    
    
    // NOTE: maybe lang files should not be defined as root, since they might get imported
    // in the tap:i18n config files (e.g. project-tap.i18n, or package-tap.i18n)
    //
    isRoot( inputFile ){
        return true;
    }
    
    getCacheKey( inputFile ){
        return [
            inputFile.getSourceHash()
        ];
    }
    
    // NOTE: runs only once in cache compiler regardless of how many archs the
    // file needs to build
    //
    compileOneFile( inputFile, allFiles ){
        const self = this;
        const fileName = inputFile.getBasename();
        const tapi18nFileType = fileName.split('.').slice( -2 ).join( '.' );
       
        const { [ tapi18nFileType ]: compiler } = compilers;
        const { compileResult = {}, referencedImportPaths = [] } = compiler.compileOneFile( ...arguments );
        
        
        const { src: { raw, js } = {} } = compileResult;
        if( typeof js === 'string' ){
            const { data } = self.babelCompiler.processOneFileForTarget( inputFile, js );
            compileResult.src.js = data;
        }else if( typeof js === 'object' ){
            const { server, client } = js;
            if( typeof server === 'string' ){
                const { data } = self.babelCompiler.processOneFileForTarget( inputFile, server );
                compileResult.src.js.server = data;
            }
            if( typeof client === 'string' ){
                const { data } = self.babelCompiler.processOneFileForTarget( inputFile, client );
                compileResult.src.js.client = data;
            }
        }
        
        return { compileResult, referencedImportPaths }; 
    }
    
    compileResultSize( compileResult ){
        return compileResult.length;
    }
    
    addCompileResult( inputFile, compileResult ){
        const fileName = inputFile.getBasename();
        const fileType = fileName.split('.').slice( -2 ).join( '.' );
        
        const { [ fileType ]: compiler } = compilers;
        compiler.addCompileResult( ...arguments );
    }
    
}



export { TAPi18nCompiler as default };
