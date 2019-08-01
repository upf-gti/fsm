//@fsmNode
(function(){
    "use strict";
    var count = 0;
    window.FSMNode = class FSMNode
    {
        constructor( o )
        {
            configure(o);
        }

        configure(o)
        {
            console.assert( this.constructor.name != "FSMNode", 
                    `This class constructor should not be called directly, use FSMNode.createNode( type, title, options ) instead.`, window.DEBUG );

            this.name = "unknown" + count++;
            this.pos =  vec2.create();
            this.size = vec2.clone(FSMNode.NODE_DEFAULT_SIZE);
            this.type = "default";

            Object.assign( this, o );
        }

        onEnter ( fsm ) {}
        onExit  ( fsm ) {}
        onUpdate( fsm, deltaTime ) {}

        //=======================================================================
        //  Node Types
        //=======================================================================
        static createNode( type, title, options = {} )
        {
            type = type || options.type || "default";

            console.assert(FSMNode.NODE_TYPES[type], `Unable to instance a new node of type: ${type}. Type not registered`,window.DEBUG); 

            if(title)
                options.name = title;
            let node = new FSMNode.NODE_TYPES[type](options);

            return node;
        }

        static registerNodeType( type, base_class )
        {
            console.assert( type && type.constructor.name == "String" && type.length > 0, 
                            `Invalid node type name: ${type}`, window.DEBUG);
            console.assert( base_class && base_class.constructor && base_class.constructor.name == "Function", 
                            `Invalid node base class: ${base_class}`, window.DEBUG);
            console.assert( !FSMNode.NODE_TYPES[type], 
                            `node type already registered: ${type}`, window.DEBUG);

            let pos         = type.lastIndexOf("/");
            let categories  = type.split("/");
            let classname   = base_class.prototype.constructor.name;

            base_class.type = type;
            base_class.category = type.substr(0, pos);
            base_class.title = base_class.title || classname;

            //extend class
            let properties = Object.getOwnPropertyNames(FSMNode.prototype);
            for (let i in properties)
            {
                //Copy only those has not been already declared in the base_class class
                if (!base_class.prototype[properties[i]])
                base_class.prototype[properties[i]] = FSMNode.prototype[properties[i]];
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
            this.widgets[widget.name] = widget;
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
                -title_height,
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
                    title_height * 0.5,
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


    }

    FSMNode.NODE_TITLE_HEIGHT = 30;
    FSMNode.NODE_SHAPE_RADIUS = 8;
    FSMNode.NODE_DEFAULT_BOXCOLOR = "#666";
    FSMNode.NODE_TITLE_TEXT_Y = 20;
    FSMNode.NODE_DEFAULT_SIZE = vec2.set(vec2.create(), 120,30);
    FSMNode.NODE_TYPES = {};
    FSMNode.WIDGET_TYPES = {};

})();