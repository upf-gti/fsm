(_=>{

    /***
     *   ████████╗██████╗ ██╗ ██████╗  ██████╗ ███████╗██████╗ ███████╗
     *   ╚══██╔══╝██╔══██╗██║██╔════╝ ██╔════╝ ██╔════╝██╔══██╗██╔════╝
     *      ██║   ██████╔╝██║██║  ███╗██║  ███╗█████╗  ██████╔╝███████╗
     *      ██║   ██╔══██╗██║██║   ██║██║   ██║██╔══╝  ██╔══██╗╚════██║
     *      ██║   ██║  ██║██║╚██████╔╝╚██████╔╝███████╗██║  ██║███████║
     *      ╚═╝   ╚═╝  ╚═╝╚═╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝
     * 
     * All registered functions needs to return a default value even when
     * fsm or node params are undefined. The returned value is used to deduce
     * the correct type. 
     */

    FSMTransition.registerTriggerFunc(
        "timeInNode",
        ( fsm, node ) => {
            if(node)
                return node.timer;

            return -1;
        }
    );

    window.roll = sides => { Math.floor(Math.random() * this.sides) + 1; }

    /*FSMTransition.registerTriggerFunc("1d3",    ( fsm, node ) => { return die(   3);});
    FSMTransition.registerTriggerFunc("1d4",    ( fsm, node ) => { return die(   4);});
    FSMTransition.registerTriggerFunc("1d5",    ( fsm, node ) => { return die(   5);});
    FSMTransition.registerTriggerFunc("1d8",    ( fsm, node ) => { return die(   8);});
    FSMTransition.registerTriggerFunc("1d10",   ( fsm, node ) => { return die(  10);});
    FSMTransition.registerTriggerFunc("1d12",   ( fsm, node ) => { return die(  12);});
    FSMTransition.registerTriggerFunc("1d20",   ( fsm, node ) => { return die(  20);});
    FSMTransition.registerTriggerFunc("1d100",  ( fsm, node ) => { return die( 100);});
    FSMTransition.registerTriggerFunc("1d1000", ( fsm, node ) => { return die(1000);});*/


})();


