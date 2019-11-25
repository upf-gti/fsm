(_=>{

    /***
     *  
     * ███████╗███████╗███╗   ███╗    ███╗   ██╗ ██████╗ ██████╗ ███████╗ ███████╗
     * ██╔════╝██╔════╝████╗ ████║    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
     * █████╗  ███████╗██╔████╔██║    ██╔██╗ ██║██║   ██║██║  ██║█████╗   ███████╗
     * ██╔══╝  ╚════██║██║╚██╔╝██║    ██║╚██╗██║██║   ██║██║  ██║██╔══╝   ╚════██║
     * ██║     ███████║██║ ╚═╝ ██║    ██║ ╚████║╚██████╔╝██████╔╝███████╗ ███████║
     * ╚═╝     ╚══════╝╚═╝     ╚═╝    ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝ ╚══════╝                                 
     *                                               
     * Nodes Class, different types of nodes may be registered.
     * Instantiate a node using the factory contructor createNode( type, title, options );
     * Register new node types using registerNodeType( type, class );
     * 
     * //TODO: add when the resource is modified LS.RM.resourceModified()
     * //TODO: fix the transition inspector in the node inspector
     */

    "use strict";

    window.FSMNode = class FSMNode
    {
        configure(o)
        {
            o = o || {};

            this.name = `${capitalize(this.constructor.name)} ${++FSMNode.count}`;
            this.type = this.constructor.name;
            this.pos =  vec2.create();
            this.size = vec2.clone(FSMNode.NODE_DEFAULT_SIZE);

            Object.assign( this, o );

            if(!this.id)    this.id = FSM._generateUID("FSMN");

            let descriptor = Object.getOwnPropertyDescriptor(this.constructor.prototype,"name");
            descriptor.enumerable = true;
            Object.defineProperty(this,"name", descriptor);
        }

        set name(newName) 
        {
            if(newName == this._name)
                return;

            if(this.onNameChanged)
            {
                if(!this.onNameChanged( this._name, newName))
                    return;
            }

            this._name = newName;   // validation could be checked here such as only allowing non numerical values
        }

        get name()
        {
            return this._name;
        }

        serialize()
        {
            return {
                id:   this.id,
                name: this.name,
                pos:  this.pos, 
                size: this.size,
                type: this.type,
            }
        }

        _enter  ( fsm ) 
        { 
            this.timer = 0;
            if(this.onEnter)
                this.onEnter( fsm ); 
        }
        _update ( fsm, deltaTime ) 
        {
            this.timer += deltaTime; 
            if(this.onUpdate)
                this.onUpdate( fsm, deltaTime ); 
        }
        _exit   ( fsm ) 
        { 
            if(this.onExit)
                return this.onExit( fsm );  
            return true;
        }

        //=======================================================================
        //  Node Types
        //=======================================================================
        static createNode( type, title, options )
        {
            options = options || {};
            type = type || options.type || "defaultNode";

            console.assert(FSMNode.NODE_TYPES[type], `Unable to instance a new node of type: ${type}. Type not registered`,window.DEBUG); 

            if(title)
                options.name = title;
            let node = new FSMNode.NODE_TYPES[type](options);

            return node;
        }

        static registerNodeType( type, base_class )
        {
            console.assert( type && type.constructor.name == "String" && type.length > 0, `Invalid node type name: ${type}`, window.DEBUG);
            console.assert( base_class && base_class.constructor && base_class.constructor.name == "Function", `Invalid node base class: ${base_class}`, window.DEBUG);
            console.assert( !FSMNode.NODE_TYPES[type], `Node type already registered: ${type}`, window.DEBUG);

            let pos         = type.lastIndexOf("/");
            let categories  = type.split("/");
            let classname   = base_class.prototype.constructor.name;

            base_class.type = type;
            base_class.category = type.substr(0, pos);
            base_class.title = base_class.title || classname;

            //extend class pragmatically
            let descriptors = Object.getOwnPropertyDescriptors(FSMNode.prototype);
            for (let i in descriptors)
            {
                let descriptor = descriptors[i];

                //If extended class implements this method, skip
                if(Object.getOwnPropertyDescriptor( base_class.prototype, i ))
                    continue;

                Object.defineProperty(base_class.prototype, i, descriptor);
            }

            FSMNode.NODE_TYPES[ type ] = base_class;
        }

        //=======================================================================
        //  Node Widgets //TODO: WIP
        //=======================================================================
        addWidget( widget )
        {
            console.assert( widget , `Tried to add a invalid widget: ${widget}`,window.DEBUG);

            this.widgets = this.widgets || [];
            this.widgets[widget.id] = widget;
        }

        static createWidget( type, options )
        {
            console.assert(FSMNode.WIDGET_TYPES[type], `Widget type not found: ${type}`,window.DEBUG);

            return new FSMNode.WIDGET_TYPES[type](options);
        }

        static registerNodeWidget( name, base_class )
        {
            name = name || base_class.name;
            console.assert( name && name.constructor.name == "String" && name.length > 0, 
                            `Invalid widget name: ${name}`, window.DEBUG);
            console.assert( base_class && base_class.constructor && base_class.constructor.name == "Function", 
                            `Invalid widget class: ${base_class}`, window.DEBUG);
            
            FSMNode.WIDGETS = FSMNode.WIDGETS || [];
            FSMNode.WIDGETS[name] = base_class;
        }

        //=======================================================================
        //  Node Render
        //=======================================================================
        draw( ctx, fgcolor, bgcolor, selected, mouse_over )
        {
            let fn = this.onDraw || this._on_draw_;
            fn.call( this, ctx, fgcolor, bgcolor, selected, mouse_over );
        }

        _on_draw_( ctx, fgcolor, bgcolor, selected, mouse_over )
        {
            let title_height = FSMNode.NODE_TITLE_HEIGHT;
            let shape_radius = FSMNode.NODE_SHAPE_RADIUS
            let boxcolor = this._boxcolor || FSMNode.NODE_DEFAULT_BOXCOLOR;
            let old_alpha = ctx.globalAlpha;
            let box_size = 10;
            let measure = ctx.measureText(this.name).width;
            let area = [
                0,
                - title_height,
                Math.max(this.size[0],measure) + 1,
                this.size[1] + title_height
            ];

            //DrawNodeShape
            {   
                ctx.strokeStyle = fgcolor;
                ctx.fillStyle = bgcolor;

                //Draw Shape
                ctx.beginPath();
                ctx.roundRect(area[0],area[1],area[2],area[3], shape_radius, shape_radius)
                ctx.fill();
                ctx.shadowColor = "transparent"; //reset shadows

                //Title separator
                ctx.fillStyle = "rgba(0,0,0,0.2)";
                ctx.fillRect(0, -1, area[2], 2);
            }

            //Title circle at left side
            {
                ctx.beginPath();
                ctx.arc(
                    title_height *  0.5,
                    title_height * -0.5,
                    box_size * 0.5 + 1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();

                ctx.fillStyle = boxcolor;
                ctx.beginPath();
                ctx.arc(
                    title_height * 0.5,
                    title_height * -0.5,
                    box_size * 0.5,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

            if(selected)
            {
                ctx.strokeStyle = "white";
                ctx.beginPath();
                ctx.roundRect(area[0]-3,area[1]-3,area[2]+6,area[3]+6, shape_radius, shape_radius)
                ctx.stroke();
            }


            //Draw Title Text
            {
                ctx.font = this.title_text_font;
                let title = this.name || "State"
                //ctx.globalCompositeOperation = "difference";
                ctx.fillStyle = bgcolor;//"white";
                let old_filter = ctx.filter;
                ctx.filter = "saturate(0%) invert(100%)";

                ctx.globalAlpha = old_alpha;
                ctx.textAlign = "left";
                ctx.fillText(
                    capitalize(title),
                    title_height,
                    FSMNode.NODE_TITLE_TEXT_Y - title_height
                );
                ctx.filter = "none";
            }
            
        }

        inspect( inspector )
        {
            let fsm = CORE.getModule("FSM").tabs_widget.getCurrentTab()[2].widget.fsmeditor.fsm;
            let keys = Object.keys(this).filter(v=>v[0] != '_').reverse();
            let disabled = false;
            disabled |= this.name == "any";
            disabled |= this.name == "default";


            inspector.addTitle("Node Properties");
            for(let k in keys)
            {
                let key = keys[k];
                if(this[key] === undefined || this[key] === null ) 
                    continue;

                let value = this[key];
                switch( value.constructor.name )
                {
                    case "Function": break;
                    case "Number":  inspector.addNumber(key, value,  { disabled: disabled, callback: (v) => { this[key] = v; } }); break;
                    case "String":  {
                        var isOk  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(value);
                        if(isOk) 
                            inspector.addColor( key, hexColorToRGBA(value), { disabled: disabled, callback: (v) => { 
                                this[key] = RGBToHex(v[0],v[1],v[2]);
                            } }); 
                        else    
                            inspector.addString(key, value, { disabled: (key == "id" || key == "type")? true : disabled, callback: (v) => { 
                                this[key] = v; 
                            } });
                        break;
                    }
                    case "Boolean": inspector.addCheckbox(key, value,{ disabled: disabled, callback: (v) => { this[key] = v; } }); break;
                    case "Array":
                    case "Float32Array": {
                        switch (value.length) {
                            case 2: inspector.addVector2(key, value, { disabled: disabled, callback: (v) => { this[key] = v; } }); break;
                            case 3: inspector.addVector3(key, value, { disabled: disabled, callback: (v) => { this[key] = v; } }); break;
                            case 4: inspector.addVector4(key, value, { disabled: disabled, callback: (v) => { this[key] = v; } }); break;
                            default:inspector.addList(key, value,    { disabled: disabled, });
                        }
                        break;
                    }
                    default: inspector.addString("!" + key, value.toString(),{ disabled: disabled });
                }
            }

            if(this.onInspect)
            {
                inspector.addSeparator();
                inspector.addTitle(capitalize(this.constructor.name) + " Properties");
                this.onInspect( inspector, fsm );
            }

            inspector.addSeparator();
            inspector.addTitle("Transitions");
            
            
            let transitions = fsm.transitions.filter( v => v.from == this.id );
            if(transitions.length)
            {
                inspector.widgets_per_row = 3;
                for(var t in transitions)
                {
                    let transition = transitions[t];
                    let values = {};
                    for(let i in fsm.states){
                        let state = fsm.states[i];
                        if(state.name != "any" && state.id != transition.from)
                            values[state.name] = state.id;
                    }

                    //inspector.addString("State", fsm.getTransitionName(transition.to, { enabled: false, callback: (v) => { this[key] = v; } } );
                    inspector.addCombo("State", fsm.states[transition.to].id, { 
                        values: values, 
                        width: "calc(100% - 60px - 30px)",
                        callback: function(v) { 
                        console.assert(fsm.states[v], `State requested "${v}" not found`, window.DEBUG);
                        transition.to = v; 
                    } });
                    inspector.addButton(null, "Edit", { 
                        width:"60px", 
                        callback: j => 
                        { 
                            EditorModule.inspector.inspect(transition);
                        }
                    });
                    inspector.addButton(null, '<img style="width:100%; filter: contrast(4);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjUxRDQxMDYwNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjUxRDQxMDYxNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTFENDEwNUU1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTFENDEwNUY1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7KsC9jAAAABlBMVEX///////9VfPVsAAAAAnRSTlP/AOW3MEoAAAAsSURBVHjaYmBEAQxQigHOZYADuCyyYgYwhDKpzEWyhBHmECRHorkZBgACDAA92gCZG0I57gAAAABJRU5ErkJggg=="/>', { 
                        width:"30px",
                        callback: j => 
                        { 
                    
                        }
                    });
                }
                inspector.widgets_per_row = 1;
            }
            else
                inspector.addInfo(null, " - empty - ");
            
            inspector.addSeparator();
        }
    }
    FSMNode.count = 0;
    FSMNode.NODE_SHAPE_RADIUS = 8;
    FSMNode.NODE_TITLE_TEXT_Y = 20;
    FSMNode.NODE_TITLE_HEIGHT = 30;
    FSMNode.NODE_DEFAULT_BOXCOLOR = "#666";
    FSMNode.NODE_DEFAULT_SIZE = vec2.set(vec2.create(), 120,30);
    FSMNode.NODE_TYPES = {};
    FSMNode.WIDGET_TYPES = {};

})();1