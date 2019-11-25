(_=>{
        
    /***
     * 
     * ███╗   ██╗ ██████╗ ██████╗ ███████╗    ██╗    ██╗██╗██████╗  ██████╗ ███████╗████████╗███████╗
     * ████╗  ██║██╔═══██╗██╔══██╗██╔════╝    ██║    ██║██║██╔══██╗██╔════╝ ██╔════╝╚══██╔══╝██╔════╝
     * ██╔██╗ ██║██║   ██║██║  ██║█████╗      ██║ █╗ ██║██║██║  ██║██║  ███╗█████╗     ██║   ███████╗
     * ██║╚██╗██║██║   ██║██║  ██║██╔══╝      ██║███╗██║██║██║  ██║██║   ██║██╔══╝     ██║   ╚════██║
     * ██║ ╚████║╚██████╔╝██████╔╝███████╗    ╚███╔███╔╝██║██████╔╝╚██████╔╝███████╗   ██║   ███████║
     * ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝     ╚══╝╚══╝ ╚═╝╚═════╝  ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝
     * 
     * //TODO: si algun widget no tubiese id en el constructor y es añadido a un nodo, podria petar al 
     * abrir el editor
     */
    
    "use strict";
    
    class progressBar
    {
        constructor(o)
        {
            this.id = FSM._generateUID("FSMW");
            this._min = 0;
            this._max = 1;
            this._value = 0.5;
            this._size = [50,50];
        }

        configure(o)
        {
            Object.assign(this, o);
        }
        
        serialize()
        {
            let data = {};
            return data;
        }

        draw()
        {
            console.log("drawing progress bar");
        }

        onMouseUp(e)    {  }
        onMouseDown(e)  {  }
        onMouseMove(e)  {  }
    }
    FSMNode.registerNodeWidget("progressBar",progressBar);

})();