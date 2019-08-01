//@fsmTransition
(function(){
    "use strict";
    var ID = 0;
    window.FSMTransition = class FSMTransition
    {
        constructor( o )
        {
            //param:"speed", operator: "<", value:0.60, isReference: false 

            this.id = ID++;
            this.from = "";
            this.to   = "";
            this.conditions = [];
            //this.param= "";
            //this.operator = "=="; //<,<=,>,>=,==,!=
            //this.value = 0;
            //this.isReference = false; //If you want to compare to another var of the same type in the same context;

            Object.assign( this, o );
        }

        check( fsm )
        {

        }

        //=======================================================================
        //  Transition Render
        //=======================================================================
        draw( ctx, fsm )
        {
            let fn = this.onDraw || this._on_draw;
            fn.call( this, ctx, fsm );
        }
        
        _on_draw( ctx, fsm )
        {

            let from =  fsm.states[ this.from ],
                to =    fsm.states[ this.to ],
                t =     this._t;

            if(!from || !to)
                throw( `Invalid transition from/to states: ${ this.from }, ${ this.to }`);

            if (true || !t || this._from != from.pos || this._to != to.pos) {
                this._from = from.pos;
                this._to = to.pos;
                this._cp = vec4.create();
        
                let dir = vec2.sub(vec3.create(), to.pos, from.pos);
                let ndir = vec3.normalize(vec3.create(), dir);
                let tmpV3 = vec3.cross(vec3.create(), ndir, [0, 0, 1]);
                vec3.mul(tmpV3, tmpV3, [5, 5, 5]);
                t = this._t = tmpV3;
            }
        
        
            let line = [from.pos[0] + t[0], from.pos[1] + t[1],
            to.pos[0] + t[0], to.pos[1] + t[1]];
            ctx.strokeStyle = "rgb(100, 100, 100)";
            ctx.fillStyle = "rgb(100, 100, 100)";

            if(this.hover){      ctx.strokeStyle = "rgb(155, 55, 55)"; ctx.fillStyle = "rgb(155, 55, 55)"; }
            if(this.selected){   ctx.strokeStyle = "rgb(255, 255, 255)"; ctx.fillStyle = "rgb(255, 255, 255)"; }

            //Draw the line
            ctx.beginPath();
            ctx.moveTo( line[0], line[1]);
            ctx.lineTo( line[2], line[3]);
            ctx.stroke();
            
            //Draw direction triangle
            let dir = [(line[2]-line[0])*.5,(line[3]-line[1])*.5];
            let p = vec2.add(vec2.create(), [line[0],line[1]], dir);

            let front = vec2.normalize(vec2.create(), dir);     vec2.mul(front, front, [3,3]);
            let right = vec2.normalize(vec2.create(), t);       vec2.mul(right, right, [3,3]);


            let p1,p2,p3;
            p1 = vec2.add(vec2.create(), p, front);
            p2 = vec2.sub(vec2.create(), p, front);
            p3 = vec2.sub(vec2.create(), p, front);
            vec2.add( p2, p2, right);
            vec2.sub( p3, p3, right);

            ctx.beginPath();
            ctx.moveTo(p1[0],p1[1]);
            ctx.lineTo(p2[0],p2[1]);
            ctx.lineTo(p3[0],p3[1]);
            ctx.lineTo(p1[0],p1[1]);
            ctx.fill();
        }
    }

})();