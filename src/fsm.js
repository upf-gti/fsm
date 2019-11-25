(_=>{

    /***
     *  
     * ███████╗███████╗███╗   ███╗
     * ██╔════╝██╔════╝████╗ ████║
     * █████╗  ███████╗██╔████╔██║
     * ██╔══╝  ╚════██║██║╚██╔╝██║
     * ██║     ███████║██║ ╚═╝ ██║
     * ╚═╝     ╚══════╝╚═╝     ╚═╝ 
     * 
     * Finite State Machine class.
     * Some references: 
     * - Stack-based FSM : https://gamedevelopment.tutsplus.com/tutorials/finite-state-machines-theory-and-implementation--gamedev-11867
     * 
     * Tips:
     * - New node types may be registered using the static function FSMNode.registerNodeType
     * - New transition conditional triggers may be registered using the static function FSMTransition.registerTriggerFunc 
     * 
     * TODO: inspector should not be here, and therefore moved to fsmEditor.
     */

    "use strict";

    window.FSM = class FSM
    {   

        constructor( o )
        {
            this.states = {};
            this.transitions = [];
            this.default = null;
            this._current = null;
            
            this.globals = this.constructor.vars;
            var that = this;
            this.vars  = new Proxy({}, {
                //We set a man in the middle to dettect any changes comming from outside and notify whoever 
                set: (target, property, value, receiver) => 
                {                    
                    if(  target[property] == value) 
                        return false;

                    target[property] = value;

                    this._onVarChanged(property, value);
        
                    return true; 
                },
                
                get: (target, property) => 
                {
                    return (target.hasOwnProperty(property))? target[property] : this.constructor.vars[property];
                },

                deleteProperty(target, prop) 
                {
                    if (prop in target) {
                        that._onVarChanged(prop, target[prop]);
                        delete target[prop];
                        return true;
                    }
                    return false;
                }
            });

            this.addNode( FSMNode.createNode("defaultNode", "any",      { id:"@FSMN-any", pos: [80,100],   size:[120,30], bgcolor:"#5fafbf" }) );
            this.addNode( FSMNode.createNode("defaultNode", "default",  { id:"@FSMN-default", pos: [80,300],   size:[120,30] }));
            this.default = "@FSMN-default";
        }

        //=======================================================================
        //  FSM Execution Phases
        //=======================================================================
        onStart()
        {
            this.changeState( this.default );
        }

        onUpdate( deltaTime )
        {
            if( this._requested )
                this.processStateChange();    

            if(!this._current) 
                return;

            if(!this.checkTransitions())  
                this.states[ this._current ]._update( this, deltaTime );
        }

        checkTransitions()
        {

            for(let i in this.transitions)
            {
                let transition = this.transitions[i];

                if(transition.from != this.states[ this._current ].id)
                    continue;

                let state = this.states[transition.from];
                console.assert(state, `State with id ${transition.from} is not found within the evaluated FSM`, window.DEBUG );

                if(transition.check( this, state ))
                {
                    this.changeState( this.transitions[i].to );
                    return true;
                }
            }

            return false;
        }

        changeState( newState )
        {
            console.assert( newState && this.states[ newState ],  `Requested state not found or null: ${newState}`, window.DEBUG );

            this._requested = newState;
        }

        processStateChange()
        {
            //oldstate may be null
            let oldState = this.states[ this._current ];
            if(oldState)
            {
                if(!oldState._exit( this, this.states[ this._requested ] )) return;
                delete oldState.current;
            }

            this._current = this._requested;
            delete this._requested;

            this.currentState = this.states[ this._current ];
            this.currentState.current = true;

            if(this.onStateChanged)
                this.onStateChanged( this, this._current );

            console.assert( this.currentState, 
                `There was a requested state with id "${this._current}" but it was not found within the included fsm states`, window.DEBUG );

            if( this.currentState )   
                this.currentState._enter( this );
        }

        _onVarChanged(property, value)
        {
            if(this.onVarChanged)
                this.onVarChanged(property, value);

            LS.RM.resourceModified(this);
        }
        
        //=======================================================================
        //  Nodes & Transitions
        //=======================================================================

        addNode( node )
        {
            console.assert( node && node.constructor && node.name && node.name.constructor.name == "String" && node.name.length > 0,
                            `Requested to add to fsm an invalid node: ${node}`, window.DEBUG );

            this.states[node.id] = node; 

            node.onNameChanged = this._onNameChanged;

            if(this.onStateAdded)
                this.onStateAdded( this, node );

            LS.RM.resourceModified(this);
        }

        removeNode( nodeID )
        {   
            console.assert( nodeID, `Provided nodeID: "${nodeID}" was invalid`, window.DEBUG);
            var node = this.states[ nodeID ];
            console.assert( node, `Node not found: "${nodeID}"`, window.DEBUG);
            if(!node)
                return;
            
            if( node.name == "default" || node.name == "any" ) 
            {
                console.warn("The states 'default' or 'any' cannot be removed as they are a core part of the FSM.", "OOps!");
                return;
            }
                
            //Remove all asociated transitions
            for(var i in this.transitions)
            {
                var t = this.transitions[i];
                if(t.from == node.id || t.to == node.id)
                    delete this.transitions[i];                
            }

            delete this.states[node.id];

            if(this.onStateRemoved)
                this.onStateRemoved( this, node );
            
            LS.RM.resourceModified(this);
        }

        _onNameChanged( oldName, newName )
        {
            console.log(`name changed from ${oldName} to ${newName}`);
            return true;
        }

        addTransition( transition )
        {
            console.assert( transition && transition.constructor.name == "FSMTransition" ,
                            `Requested to add to fsm an invalid transition: ${transition}`, window.DEBUG );
            
            this.transitions.push(transition);

            
            if(this.onTransitionAdded)
                this.onTransitionAdded( this, transition );

            LS.RM.resourceModified(this);
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

            if(this.onTransitionRemoved)
                this.onTransitionRemoved( this, transition );

            LS.RM.resourceModified(this);
        }

        //=======================================================================
        //  Resource data
        //=======================================================================
        fromData( json )
        {
            let data;
            try{
                data = JSON.parse(json);
            }
            catch(e){
                console.error(e);
                return;
            }

            //parse and fill the instance
            for(var i in data.vars)         this.vars[i] = data.vars[i];   
            for(var i in data.states)       this.addNode( FSMNode.createNode(null, null, data.states[i]) );
            for(var i in data.transitions)  this.addTransition( new FSMTransition(data.transitions[i]) ); 
            
            
            if(data.default)
            {
                this.default = null;

                let s = this.states[ data.default ];
                if( s !== undefined )
                    this.default = s.id;

                if(this.states && this.states.length > 0 && this.states[0].id)
                    this.default = this.states[0].id;
            }
        }

        toData()
        {
            //generate data
            var data = {
                vars: this.vars,
                globals: this.constructor.vars,
                states:  Object.values(this.states).map( (v,k,a) => v.serialize() ),
                transitions: this.transitions.map( (v,k,a) => v.serialize() ),
                default: this.default,
            };
            data = JSON.stringify( data, null, '\t' );
            return data;
        }

        inspect( inspector )
        {
            inspector.addInfo(null, "WIP");
            var that = this;

            
            inspector.widgets_per_row = 1;
            inspector.addSeparator();
            inspector.addTitle("Resource BlackBoard");
            inspector.widgets_per_row = 2;
            that._widgets = that._widgets || {};
            if(Object.keys(that.vars).length)
            {
                for(let key in that.vars)
                {
                    let value = that.vars[key];
                    switch( value.constructor.name )
                    {
                        case "Number":  that._widgets[key] = inspector.addNumber(key, value,  { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(that, "vars/" + key), callback: (v) => { that.vars[key] = v; } }); break;
                        case "String":  that._widgets[key] = inspector.addString(key, value,  { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(that, "vars/" + key), callback: (v) => { that.vars[key] = v; } }); break;
                        case "Boolean": that._widgets[key] = inspector.addCheckbox(key, value,{ width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(that, "vars/" + key), callback: (v) => { that.vars[key] = v; } }); break;
                        case "Array": case "Float32Array": {
                            switch (value.length) {
                                case 2: that._widgets[key] = inspector.addVector2(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(that, "vars/" + key), callback: (v) => { that.vars[key] = v; } }); break;
                                case 3: that._widgets[key] = inspector.addVector3(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(that, "vars/" + key), callback: (v) => { that.vars[key] = v; } }); break;
                                case 4: that._widgets[key] = inspector.addVector4(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(that, "vars/" + key), callback: (v) => { that.vars[key] = v; } }); break;
                                default:that._widgets[key] = inspector.addList(key, value,    { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(that, "vars/" + key) });
                            }
                            break;
                        }
                        default: that._widgets[key] = inspector.addString("!" + key, value.toString(), { width:"calc(100% - 30px)"});
                    }
    
        
                    inspector.addButton(null, '<img style="width:100%; filter: contrast(4);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjUxRDQxMDYwNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjUxRDQxMDYxNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTFENDEwNUU1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTFENDEwNUY1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7KsC9jAAAABlBMVEX///////9VfPVsAAAAAnRSTlP/AOW3MEoAAAAsSURBVHjaYmBEAQxQigHOZYADuCyyYgYwhDKpzEWyhBHmECRHorkZBgACDAA92gCZG0I57gAAAABJRU5ErkJggg=="/>', 
                    { width:"30px", callback: j => { 
                        delete that._widgets[key];
                        delete that.vars[key];
                        inspector.refresh();
                    }} );
    
                }
    
            }
            else{
                inspector.addInfo(null, " - empty - ");
            }
     
            

            if(that._createvar)
            {
                inspector.addSeparator();
                inspector.widgets_per_row = 2;
               
                var name = that._createvarname = inspector.addString( 
                    "New value", 
                    that._createvarname? that._createvarname.getValue() : `_var_${Object.keys(that.vars).length}`, 
                    { 
                        width:"72%", 
                        callback: v => that._createvarname.setValue(v) 
                    } 
                );
                
                var types = (["boolean","number","string", "vec2", "vec3", "vec4"]).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );//Object.values(LS.TYPES).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );
                
                that._createvartype = inspector.addCombo(
                    null, 
                    (that._createvartype)?that._createvartype.getValue() : "number", 
                    { 
                        width:"28%",
                        values: types, 
                        callback: _ => inspector.refresh()
                    }
                );
                    
                inspector.widgets_per_row = 3;

                switch(that._createvartype.getValue())
                {
                    case("boolean"): that._createvartype.setValue("checkbox"); break;
                }
                    
                let value = inspector.add(
                    that._createvartype.getValue(), 
                    null , 
                    null,
                    {
                        width:"calc(100% - 60px)"
                    }
                );
                
                switch(that._createvartype.getValue())
                {
                    case("vec2"):case("vec3"):case("vec4"):case("position"):{
                        value.getValue = function()
                        { 
                            return value.draggers.map( e => e.value );
                        }
                        break;
                    }
                }
            
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABOElEQVR4Ae3TgUYEYRSG4YW1diNCwAIGUJs5h7q3QIGQhAjdRyIt7EIQBF1FRBcwKXwso+KwZw7v+1/A/3zzmxEREREREREREW3W7ttpYf7hnr9557d1+a/efR+7LszXhKp8nYuqfJ32vCZfx87gw/+jZrc6/wV+UvATgg8f/mKnOv8ZflbwE4IP30/syWejQPNpIv/o2D698/V8GuCv8/jtD7/ThGp8/9CVmlCGvzjY4GtCFf7c33uuXv3/d/aZrTL4yu56rtcr5H/9wIRmks8PTbClJgyWH5jQTBL5gQni2zKbH5iQzw9NGCJf2c1vE/L5gQk+zufHJjz4eOh85Vd9TL/3xxA//xXK8DWhLl8TSvKVXZbma0JdvibU5WtCXb4m1OVrQl2+JhTla8J2+URERERERET0BTMPgAX3NpM4AAAAAElFTkSuQmCC"/>', 
                { width:"30px", callback: function(v) { 
                    that.vars[name.getValue()] = value.getValue();
                    delete that._createvar; 
                    delete that._createvartype; 
                    delete that._createvarname; 
                    inspector.refresh(); 
                }});
                
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABZUlEQVR4Ae2agWYDQRRFBxCxHxEAFsY8CwsW+r9pAdWgAvmdCttVmJJiIEzFO55wz/zAOWRj5s0kIYQQQgghhBBC/I9xsPc8JYA8lY9xSCy2t4vVcs0ToH+1ahfbs/pnq1Z9E5r+bZ2xhMPuT78lAPq3hMMO0S8nq1a9E5p+W+UEJNjRalstwVW/rWPyJi9l80/I8z39suUlNfCE+XF9W7v6fIKtecb1+QRcn0/A9fkEXJ9PwPXjE/JyT99WQB8Q6Yc7AH6IqD6fgOrzCag+n4Dq8wmYPp/gsAmMTsgvDtvwyAT7idR3OJzw+sxsgdfnE3h9PoHS5xMA/fgA+6IC9BMCPmL9jQL6fAKgXzb7jkxwmHF2ZqraTutAwx8pdaiPH6tosBU/WtRwN368rguO2CsmXfLFX7Pqott3xhmQUN589TsJr8/03GbuP7fRg6foJ2d69NcYh/IZ/+xSCCGEEEIIIYQQvw2UKo1mqKrvAAAAAElFTkSuQmCC"/>', 
                { width:"30px", callback: function(v) { 
                    delete that._createvar; 
                    delete that._createvartype; 
                    delete that._createvarname; 
                    inspector.refresh() 
                }});
                
            }
            else
            {
                inspector.widgets_per_row = 1;
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAAB9JREFUeAFjgIJRwP+BZM4oh/8/GHygIYd8h45yRgEAaHBnmaA4EHkAAAAASUVORK5CYII="/>', 
                { width:"30px", callback: function(v) { 
                    that._createvar = true;
                    inspector.refresh()
                }});
            }

            inspector.addSeparator();

            if(!that.onVarChanged)
            {
                that.onVarChanged = (property, value) => {
                    if(that._widgets[property]
                    && that._widgets[property].getValue() != value )
                    {
                        that._widgets[property].setValue( value );
                        inspector.refresh();
                    }
                }
            }

            this.onStateAdded 
            = this.onStateRemoved 
            = this.onTransitionAdded 
            = this.onTransitionRemoved 
            = _ => {
                inspector.refresh();
            }

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

        deleteProperty(target, prop) 
        {
            if (prop in target) {
                delete target[prop];

                if(FSM.onGlobalChanged)
                    FSM.onGlobalChanged(prop, value);

                return true;
            }
            return false;
        }
    });
    FSM._generateUID = function(prefix, sufix)
    {
        if(FSM.generateUID)
            return FSM.generateUID(prefix, sufix);
        
        console.assert(!!LS, "LiteScene was not found, please provide a static function to this class named generateUID to identify nodes and transitions", window.DEBUG);
        return LS.generateUId(prefix,sufix);
    }

    if( LS )
        LS.registerResourceClass( FSM );

})();