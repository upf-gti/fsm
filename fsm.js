//@fsmComponent
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
 * 		https://github.com/jagenjo/litescene.js/blob/master/guides/programming_components.md
 */ 
(function(){
    "use strict";

    window.FSM = class FSM
    {   /**
        * Creates an instance of FSM.
        * Stack-based FSM : https://gamedevelopment.tutsplus.com/tutorials/finite-state-machines-theory-and-implementation--gamedev-11867
        * @param {*} o
        * @memberof FSM
        */
        constructor( o )
        {
            this.states = {};
            this.transitions = [];
            this.default = null;
            this._current = null;
            
            //TODO: This is not going to work
            this.globals = this.constructor.vars;
            this.vars  = new Proxy({}, {
                set: (target, property, value, receiver) => 
                {                    
                    if(  target[property] == value) 
                        return false;

                    target[property] = value;

                    if(this.onVarChanged)
                        this.onVarChanged(property, value);
        
                    return true; 
                },
                
                get: (target, property) => 
                {
                    return (target.hasOwnProperty(property))? target[property] : this.constructor.vars[property];
                },

                deleteProperty(target, prop) 
                {
                    if (prop in target) {
                        delete target[prop];

                        if(this.onVarChanged)
                            this.onVarChanged(property, value);

                        return true;
                    }
                    return false;
                }
            });

            this.addNode( FSMNode.createNode("default", "any",      { pos: [80,100],   size:[120,30], bgcolor:"#5fafbf" }));
            this.addNode( FSMNode.createNode("default", "default",  { pos: [80,300],   size:[120,30] }));
            this.default = "default";
        }

        //=======================================================================
        //  FSM Execution Phases
        //=======================================================================
        onStart()
        {
            this._current = this.defaut;
        }

        onUpdate( deltaTime )
        {
            if( this._requestedStateChange )
                this.processStateChange();    

            if(!this._current) 
                return;

            let state = this.states[ this._current ];
            
            if(!this.checkTransitions())  
                state.update( this, deltaTime );
        }

        checkTransitions()
        {
            for(let i in this.transitions)
            {
                this.transitions[i].check( this );
            }
        }

        changeState( newState )
        {
            console.assert( newState && this.states[ newState ], 
                            `Requested state not found or null: ${newState}`, window.DEBUG );

            this._requestedStateChange = newState;
        }

        procesStateChange()
        {
            let oldState = this.states[ this._current ];
            
            if( oldState )
                oldState.onExit( this );

            this._current = this._requested;
            delete this._requested;

            let newState = this.states[ this._current ];
            console.assert( newState, 
                `There was a requested state named "${this._current}" but it was not found within the included fsm states`, window.DEBUG );

            if( newState )   
                newState.onEnter( this );
        }

        
        //=======================================================================
        //  Nodes & Transitions
        //=======================================================================

        addNode( node )
        {
            console.assert( node && node.constructor && node.name && node.name.constructor.name == "String" && node.name.length > 0,
                            `Requested to add to fsm an invalid node: ${node}`, window.DEBUG );

            this.states[node.name] = node; 
        }

        removeNode( nodeName )
        {   
            if( name == "default" || name == "any" ) 
            {
                console.warn("The states 'default' or 'any' cannot be removed as they are a core part of the FSM.", "OOps!");
                return;
            }
                
            //Remove all asociated transitions
            for(var i in this.transitions)
            {
                var t = this.transitions[i];
                if(t.from == name || t.to == name)
                    delete this.transitions[i];                
            }

            delete this.states[name];
        }

        addTransition( transition )
        {
            console.assert( transition && transition.constructor.name == "FSMTransition" ,
                            `Requested to add to fsm an invalid transition: ${transition}`, window.DEBUG );
            
            this.transitions.push(transition);
        }

        removeTransition( id )
        {
            for(var i in this.transitions)
            {
                var t = this.transitions[i];
                if(t.id == id){
                    delete this.transitions[i];                
                    return;
                }
            }
        }

        //=======================================================================
        //  Resource data
        //=======================================================================
        fromData( data )
        {
            //parse and fill the instance
            for(var i in data.vars)         this.vars[i] = data.vars[i];   
            for(var i in data.states)       this.addNode( FSMNode.createNode(null, null, data.states[i]) );
            for(var i in data.transitions)  this.createTransition( new FSMTransition(data.transitions[i]) ); 
            
            if(data.default)
            {
                this.default = null;

                let s = this.states[ data.default ];
                if( s !== undefined )
                    this.default = s.name;

                if(this.states && this.states.length > 0 && this.states[0].name)
                    this.default = this.states[0].name;
            }
        }

        toData()
        {
            //generate data
            var data = {
                vars: this.vars,
                globals: this.constructor.vars,
                states:  this.states,
                transitions: this.transitions,
                default: this.default,
            };
            data = JSON.stringify( data, null, '\t' );
            return data;
        }
        
    }
    FSM.FORMAT = { extension: "fsm", dataType: "text" };
    FSM.vars = new Proxy({}, {
        set: (target, property, value, receiver) => 
        {                    
            if(  target[property] == value) 
                return false;

            target[property] = value;

            if(FSM.onGlobalChanged)
                FSM.onGlobalChanged(property, value);

            return true; 
        },
        
        get: (target, property) => 
        {
            return (target.hasOwnProperty(property))? target[property] : this.constructor.vars[property];
        },

        deleteProperty(target, prop) 
        {
            if (prop in target) {
                delete target[prop];

                if(FSM.onGlobalChanged)
                    FSM.onGlobalChanged(property, value);

                return true;
            }
            return false;
        }
    });

    LS.registerResourceClass( FSM );

})();