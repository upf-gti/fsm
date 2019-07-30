/**
 * https://webglstudio.org/users/hermann/files/components/fsm/_.js
 */

{

    async function loadJS(...request)
    {
        for(var r in request)
        {   
            let promise = new Promise( function(resolve, reject)
            {
                if(typeof request[r] == "string")
                request[r] = [request[r]];
                
                const [ url, location = document.body, callback = _=>{ /*console.log(url+"#"+performance.now())*/} ] = request[r]; 
                
                var scriptTag = document.createElement('script');
                scriptTag.src = url;
                
                scriptTag.onload = _=>{ callback(); resolve(scriptTag); };
                scriptTag.onerror = reject;
                scriptTag.onreadystatechange = callback;
                
                location.appendChild(scriptTag);
                return callback;
            });

            await promise;
        }
    };

    if (typeof console._commandLineAPI !== 'undefined') {
        console.API = console._commandLineAPI; //chrome
    } else if (typeof console._inspectorCommandLineAPI !== 'undefined') {
        console.API = console._inspectorCommandLineAPI; //Safari
    } else if (typeof console.clear !== 'undefined') {
        console.API = console;
    }
    console.clear = console.clear || console.API.clear;

    console.clear();
    var script = document.currentScript;
    var path = script.src.substr(0,script.src.lastIndexOf("/")+1);

    loadJS(
        path + 'polyfill.js',
        path + 'fsmTransition.js',
        path + 'fsmNode.js',
        path + 'fsm.js',
        path + 'widgets.js',
        path + 'nodes.js',
        path + 'webglstudio/fsmPlayer.js',
        path + 'webglstudio/fsmEditor.js',
        path + 'webglstudio/fsmWidget.js',
        path + 'webglstudio/fsmModule.js',
    )
    .then( _=>{

        /*var ref = document.createElement("link");
        ref.src =  "https://fonts.googleapis.com/icon?family=Material+Icons";
        document.head.appendChild( ref );*/


        if(LS)
        {
            if(LS.Components["FSM"])
            LS.unregisterComponent("FSM");
            LS.registerComponent( FSM );
        } 

        console.log("FSM ready to go!");
    })

}