(_=>{

    /***
     * 
     * ███╗   ██╗ ██████╗ ██████╗ ███████╗    ████████╗██╗   ██╗██████╗ ███████╗███████╗
     * ████╗  ██║██╔═══██╗██╔══██╗██╔════╝    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔════╝
     * ██╔██╗ ██║██║   ██║██║  ██║█████╗         ██║    ╚████╔╝ ██████╔╝█████╗  ███████╗
     * ██║╚██╗██║██║   ██║██║  ██║██╔══╝         ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  ╚════██║
     * ██║ ╚████║╚██████╔╝██████╔╝███████╗       ██║      ██║   ██║     ███████╗███████║
     * ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝       ╚═╝      ╚═╝   ╚═╝     ╚══════╝╚══════╝
     */

    "use strict";

    class defaultNode{
        constructor(o){
            this.configure(o);
        }
    }
    FSMNode.registerNodeType( "defaultNode", defaultNode );
    
    class playAnimation{
        constructor(o){
            this.bgcolor = "#005377";
            this.animation_filename = "";
            this._animation = null;

            this.configure(o);

            if(this.animation_file && !this._animation)
            {
                LS.ResourcesManager.load(this.animation_filename, function(res) {
                    console.assert( res, `Resource is empty`, window.DEBUG);
                    this._animation = res;
                    this._animation.ready = true;
                });         
            }
        }

        //TODO: needs to be tied with animation system
        onUpdate( dt )
        {
            console.log("playing animation");
        }

        onInspect( inspector, fsm )
        {
           inspector.addResource("Animation", this.animation_filename, { width:"calc(80% - 30px)", callback: v => { 
                debugger;
                //this._animation = res;
                this._animation.ready = true;    
                this.animation_filename = v;
                inspector.refresh();
            }}, "Animation");
        }
    }
    FSMNode.registerNodeType( "animation/playAnimation", playAnimation );

    class blendTreeAnimation{
        constructor(o){
            this.configure(o);
        }

        //TODO: needs to be tied with animation system and NNI
        onUpdate( dt )
        {
            console.log("playing blendtree animation");
        }
    }
    FSMNode.registerNodeType( "animation/blendTreeAnimation", blendTreeAnimation );

})();
