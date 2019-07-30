//@fsmNode
(function(){
    "use strict";
    var count = 0;
    window.Node = class Node
    {
        constructor( o )
        {
            this.name = "unknown" + count++;
            this.pos = vec2.create();
            this.size = vec2.set(vec2.create(), 1,1);
            this.type = "default";
            
            if(o)
                this.configure( o );
        }

        configure( o = {} )
        {
            Object.assign( this, o );

            this.name = this.name || "unknown" + count++;
            this.size = this.size || [120,30];

        }

        serialize()
        {
            let data = {};
            Object.assign(data, this);
            return data;
        }

        onEnter( dt )
        {}

        onUpdate( dt )
        {}

        onExit( dt )
        {}
        
        _on_draw_( ctx, fgcolor, bgcolor, selected, mouse_over )
        {
            let title_height = Node.NODE_TITLE_HEIGHT;
            let shape_radius = Node.NODE_SHAPE_RADIUS
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

                ctx.fillStyle = this._boxcolor || Node.NODE_DEFAULT_BOXCOLOR;
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
                var title = this.name || "State"
                //ctx.globalCompositeOperation = "difference";
                ctx.fillStyle = bgcolor;//"white";
                var old_filter = ctx.filter;
                ctx.filter = "saturate(0%) invert(100%)";

                //var measure = ctx.measureText(title);
                ctx.globalAlpha = old_alpha;
                ctx.textAlign = "left";
                ctx.fillText(
                    capitalize(title),
                    title_height,
                    Node.NODE_TITLE_TEXT_Y - title_height
                );
                ctx.filter = "none";
            }
            
        }

        draw( ctx, fgcolor, bgcolor, selected, mouse_over )
        {
            let fn = this.onDraw || this._on_draw_;
            fn.call( this, ctx, fgcolor, bgcolor, selected, mouse_over );
        }

        addWidget( type, options )
        {
            this.widgets = this.widgets || [];

            if(!Node.WIDGETS[type]) throw("widget type not found");

            let widget = new Node.WIDGETS[type](options);

        }

        static registerNodeWidget( name, base_class )
        {
            Node.WIDGETS = Node.WIDGETS || [];
            Node.WIDGETS[name] = base_class;
        }
    
    }
    Node.SHAPE = Enum(
        "BOX",
        "ROUND",
        "CIRCLE",
        "CARD",
        "ARROW"
    );
    Node.NODE_TITLE_HEIGHT = 30;
    Node.NODE_SHAPE_RADIUS = 8;
    Node.NODE_DEFAULT_BOXCOLOR = "#666";
    Node.NODE_TITLE_TEXT_Y = 20;

})();