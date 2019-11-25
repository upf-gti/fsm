/***
 *
 *                                               ,---,  
 *                  .--,-``-.                 ,`--.' |  
 *      ,---,      /   /     '.   ,-.----.    |   :  :  
 *    ,--.' |     / ../        ;  \    /  \   '   '  ;  
 *    |  |  :     \ ``\  .`-    ' ;   :    \  |   |  |  
 *    :  :  :      \___\/   \   : |   | .\ :  '   :  ;  
 *    :  |  |,--.       \   :   | .   : |: |  |   |  '  
 *    |  :  '   |       /  /   /  |   |  \ :  '   :  |  
 *    |  |   /' :       \  \   \  |   : .  /  ;   |  ;  
 *    '  :  | | |   ___ /   :   | ;   | |  \  `---'. |  
 *    |  |  ' | :  /   /\   /   : |   | ;\  \  `--..`;  
 *    |  :  :_:,' / ,,/  ',-    . :   ' | \.' .--,_     
 *    |  | ,'     \ ''\        ;  :   : :-'   |    |`.  
 *    `--''        \   \     .'   |   |.'     `-- -`, ; 
 *                  `--`-,,-'     `---'         '---`"  
 *          
 *   this file location:
 *   https://webglstudio.org/users/hermann/files/components/fsm/_.js
 * 	 https://github.com/jagenjo/litescene.js/blob/master/guides/programming_components.md
 */ 

{
    /* deferred loading */ async function loadJS(...request){for(var r in request){let promise=new Promise(function(resolve,reject){if(typeof request[r]=="string")request[r]=[request[r]];const[url,location=document.body,callback=_=>{}]=request[r];var scriptTag=document.createElement('script');scriptTag.src=url;scriptTag.onload=_=>{callback();resolve(scriptTag)};scriptTag.onerror=reject;scriptTag.onreadystatechange=callback;location.appendChild(scriptTag);return callback});await promise}};
    /* console clear*/ if(typeof console._commandLineAPI!=='undefined'){console.API=console._commandLineAPI}else if(typeof console._inspectorCommandLineAPI!=='undefined'){console.API=console._inspectorCommandLineAPI}else if(typeof console.clear!=='undefined'){console.API=console}console.clear=console.clear||console.API.clear
    
    console.clear();
    
    window.DEBUG = true;
    
    var script = document.currentScript;
    var path = script.src.substr(0,script.src.lastIndexOf("/")+1);

    if(LS)
    {
        LS.Network.importScript(path + 'polyfill.js');
        LS.Network.importScript(path + 'fsmTransition.js');
        LS.Network.importScript(path + 'fsmNode.js');
        LS.Network.importScript(path + 'fsm.js');
        LS.Network.importScript(path + 'widgets.js');
        LS.Network.importScript(path + 'nodes.js');
        LS.Network.importScript(path + 'triggers.js');
        LS.Network.importScript(path + 'webglstudio/fsmPlayer.js');
        LS.Network.importScript(path + 'webglstudio/fsmEditor.js');
        LS.Network.importScript(path + 'webglstudio/fsmWidget.js');
        LS.Network.importScript(path + 'webglstudio/fsmModule.js');
    }
    else
    {
        loadJS(
            path + 'polyfill.js',
            path + 'fsmTransition.js',
            path + 'fsmNode.js',
            path + 'fsm.js',
            path + 'widgets.js',
            path + 'nodes.js',
            path + 'triggers.js',
            path + 'webglstudio/fsmPlayer.js',
            path + 'webglstudio/fsmEditor.js',
            path + 'webglstudio/fsmWidget.js',
            path + 'webglstudio/fsmModule.js',
        )
        .then( _=>{
            console.log("FSM ready to go!");
        })
    }



}