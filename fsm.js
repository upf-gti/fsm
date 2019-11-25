"use strict";

/***
 * ██████╗  ██████╗ ██╗  ██╗   ██╗███████╗██╗██╗     ██╗     
 * ██╔══██╗██╔═══██╗██║  ╚██╗ ██╔╝██╔════╝██║██║     ██║     
 * ██████╔╝██║   ██║██║   ╚████╔╝ █████╗  ██║██║     ██║     
 * ██╔═══╝ ██║   ██║██║    ╚██╔╝  ██╔══╝  ██║██║     ██║     
 * ██║     ╚██████╔╝███████╗██║   ██║     ██║███████╗███████╗
 * ╚═╝      ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝╚══════╝╚══════╝
 */

"use strict";

console.assert	= function(cond, text, dontThrow)
{
    if ( cond ) 
        return;

    if ( dontThrow )
        debugger;
    else
        throw new Error( text || "Assertion failed!" );
};

function capitalize(s)
{
    if (typeof s !== 'string') 
        return '';
    
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function Enum(...items)
{
  let v = {};
  for(var i in items)
  {
    v[items[i]] = parseInt(i);  
  }
  return v;
}

//https://gist.github.com/anish000kumar/0fd37acc866a9577cf259980500b1bbe


(_=>{

    /***                                                                 
     * 
     * ███████╗███████╗███╗   ███╗    ████████╗██████╗  █████╗ ███╗   ██╗███████╗██╗████████╗██╗ ██████╗ ███╗   ██╗ ███████╗
     * ██╔════╝██╔════╝████╗ ████║    ╚══██╔══╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██║╚══██╔══╝██║██╔═══██╗████╗  ██║ ██╔════╝
     * █████╗  ███████╗██╔████╔██║       ██║   ██████╔╝███████║██╔██╗ ██║███████╗██║   ██║   ██║██║   ██║██╔██╗ ██║ ███████╗
     * ██╔══╝  ╚════██║██║╚██╔╝██║       ██║   ██╔══██╗██╔══██║██║╚██╗██║╚════██║██║   ██║   ██║██║   ██║██║╚██╗██║ ╚════██║
     * ██║     ███████║██║ ╚═╝ ██║       ██║   ██║  ██║██║  ██║██║ ╚████║███████║██║   ██║   ██║╚██████╔╝██║ ╚████║ ███████║
     * ╚═╝     ╚══════╝╚═╝     ╚═╝       ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚══════╝
     *                                                                                                                                                                    
     * Transition Class
     * A single state may refer to N transitions evaluated as logic OR.
     * A transition may contain N conditions evaluated as AND
     * Conditions can be bool, number, string, vec2,vec3, vec4, and triggers.
     * To define a trigger, the value expects a string and a extra bool parameter isTrigger has to be set to true
     * 
     * //TODO: check transition conditions is not done
     */

    "use strict";
        window.FSMTransition = class FSMTransition
    {
        constructor( o )
        {
            this.id = FSM._generateUID("FSMT");
            this.from = "";
            this.to   = "";
            this.conditions = [];

            Object.assign( this, o );
        }

        serialize()
        {
            return {
                id:   this.id,
                from: this.from,
                to:   this.to,
                conditions: this.conditions,
            }
        }

        addCondition( param, operator, value )
        {
            let fsm = CORE.getModule("FSM").tabs_widget.getCurrentTab()[2].widget.fsmeditor.fsm;
            console.assert(fsm, "FSM not found! :OOO", window.DEBUG);            
            console.assert(param, "Tryed to add a condition using undefined or null param", window.DEBUG);

            let A = null;
            let type = null;
            switch(param.constructor.name)
            {
                case "String":  
                {
                    if(fsm.vars[param]){
                        A = fsm.vars[param];
                        type = A.constructor.name;
                    }

                    if(FSMTransition.registered_funcs[param]){
                        A = FSMTransition.registered_funcs[param];
                        let v = A();
                        type = v.constructor.name;
                    }

                    break;
                }  
                case "Function": 
                {
                    A = param;
                    let v = A();
                    type = v.constructor.name;
                    break;   
                }
            }
            console.assert( A, `Failed to add param, invalid type: ${param.constructor.name}. Only string (key) or function(trigger) is accepted.`, window.DEBUG );
            console.assert( type == value.constructor.name, "Failed to add param, type missmatch", window.DEBUG );    

            let operator_func = null;
            switch(operator)
            {
                case "==": operator_func = (X,Y) => { return X == Y;}; break;
                case "!=": operator_func = (X,Y) => { return X != Y;}; break;
                case "<=": operator_func = (X,Y) => { return X <= Y;}; break;
                case ">=": operator_func = (X,Y) => { return X >= Y;}; break;
                case ">":  operator_func = (X,Y) => { return X >  Y;}; break;
                case "<":  operator_func = (X,Y) => { return X <  Y;}; break;
            }
            console.assert( operator_func, `Unrecognised operator "${operator}"`, window.DEBUG );
            
            
            if(A && operator_func)
                this.conditions.push([A, operator_func, value]);
            
        }

        check( fsm, state )
        {
            if(!this.conditions.length)
                return false;
                
            let all_ok = true;
            for(let cond of this.conditions)
            {
                if(cond.length != 3)
                    continue;

                switch(cond[0].constructor.name){
                    case "String":   all_ok &= cond[1](fsm.vars[cond[0]]  ,cond[2]); break;
                    case "Function": all_ok &= cond[1](cond[0](fsm, state),cond[2]); break;
                }
            }
            return all_ok;
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
                throw( `Invalid transition from/to states: "${ this.from }", "${ this.to }"`);

            if (true || !t || this._from != from.pos || this._to != to.pos) {
                this._from = from.pos;
                this._to =   to.pos;
                this._cp =   vec4.create();
        
                let dir   = vec2.sub(vec3.create(), to.pos, from.pos);
                let ndir  = vec3.normalize(vec3.create(), dir);
                let tmpV3 = vec3.cross(vec3.create(), ndir, [0, 0, 1]);
                vec3.mul(tmpV3, tmpV3, [5, 5, 5]);
                t = this._t = tmpV3;
            }
        
        
            let line = [from.pos[0] + t[0], from.pos[1] + t[1],
            to.pos[0] + t[0], to.pos[1] + t[1]];
            ctx.strokeStyle = "rgb(100, 100, 100)";
            ctx.fillStyle = "rgb(100, 100, 100)";

            if(this._hover){      ctx.strokeStyle = "rgb(155, 55, 55)"; ctx.fillStyle = "rgb(155, 55, 55)"; }
            if(this._selected){   ctx.strokeStyle = "rgb(255, 255, 255)"; ctx.fillStyle = "rgb(255, 255, 255)"; }

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
        
        inspect( inspector )
        {
            let fsm = CORE.getModule("FSM").tabs_widget.getCurrentTab()[2].widget.fsmeditor.fsm;
            var that = this;

            inspector.addTitle(`Transition ${capitalize(fsm.states[this.from].name)} - ${capitalize(fsm.states[this.to].name)}`);
            let values = {};
            for(let i in fsm.states){
                let state = fsm.states[i];
                if(state.name != "any" && state.id != this.to)
                    values[state.name] = state.id;
            }
            inspector.addCombo('From', this.from, { values: values, callback: v => { this.from = v; inspector.refresh(); } });

            values = {};
            for(let i in fsm.states){
                let state = fsm.states[i];
                if(state.name != "any" && state.id != this.from)
                    values[state.name] = state.id;
            }
            inspector.addCombo('To',   this.to,   { values: values,   callback: v => { this.to   = v; inspector.refresh(); } });


            inspector.addSeparator();
            inspector.addInfo(null, "All the conditions listed here are treated like AND operations, to add OR operations please add a new transition to the same state");
            

            inspector.addSeparator();

            inspector.addTitle(`Conditions`);
            if(this.conditions.length )
            {
                inspector.widgets_per_row = 4;
                for(let i in this.conditions)
                {
                    let condition = this.conditions[i];

                    let name = "", type = null, value = condition[2];
                    switch(condition[0].constructor.name)
                    {
                        case "Function":
                        {
                            name = condition[0].name;
                            type = condition[0]().constructor.name;
                            break;
                        }

                        case "String":
                        {
                            let v = fsm.vars[condition[0]] || FSMTransition.registered_funcs[condition[0]];
                            name = condition[0];
                            type = v.constructor.name;
                            switch(v.constructor.name)
                            {
                                case "Function": type = v().constructor.name; break;
                                case "Boolean":  type = "checkbox"; break;
                                case "Array":
                                case "Float32Array":
                                {
                                    switch (v.length) {
                                        case 2:  type = "vec2"; break;
                                        case 3:  type = "vec3"; break;
                                        case 4:  type = "vec4"; break;
                                        default: type = "list"; break;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    name = capitalize(name);
                    type = type.toLowerCase();

                    inspector.addString(null, name, {disabled:true});

                    let values = {
                        "==": (X,Y) => { return X == Y;},
                        "!=": (X,Y) => { return X != Y;},
                        "<=": (X,Y) => { return X <= Y;},
                        ">=": (X,Y) => { return X >= Y;},
                        ">":  (X,Y) => { return X >  Y;},
                        "<":  (X,Y) => { return X <  Y;},
                    }
 
                    let key = Object.keys(values).filter( (v,k,a)=>{
                        return condition[1].toString().substr(9).includes(v);
                    })[0];
                    inspector.addCombo(null, key, { width: "60px", values: ["==","!=","<=",">=",">","<"], callback: v => { debugger;condition[1] = values[v]; } } );

                    inspector.add(type, null, condition[2]);

                    inspector.addButton(null, '<img style="width:100%; filter: contrast(4);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjUxRDQxMDYwNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjUxRDQxMDYxNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTFENDEwNUU1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTFENDEwNUY1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7KsC9jAAAABlBMVEX///////9VfPVsAAAAAnRSTlP/AOW3MEoAAAAsSURBVHjaYmBEAQxQigHOZYADuCyyYgYwhDKpzEWyhBHmECRHorkZBgACDAA92gCZG0I57gAAAABJRU5ErkJggg=="/>', 
                    { width:"30px", callback: j => { 
                        delete this.conditions[i];
                        inspector.refresh();
                    }} );
                }
                inspector.widgets_per_row = 1;
            }
            else
            {
                inspector.addInfo(null, " - empty - ");
            }
            

            if(this._createcond)
            {
                inspector.addSeparator();
                inspector.addInfo(null, " - Only those variables added to the blackboard and registered triggers will be listed here - ");
                var types = {};
                inspector.widgets_per_row = 2;
                for(let v in fsm.vars)
                {
                    let type = fsm.vars[v].constructor.name;
                    if( type == "Array" || type == "Float32Array" )
                        type = (fsm.vars[v].length > 4 || !fsm.vars[v].length )? list : `vec${fsm.vars[v].length}`;
                    
                    types[`<${type}> ${v}`] = {type:type, key:v};
                }

                for(let v in FSMTransition.registered_funcs)
                {
                    let type = FSMTransition.registered_funcs[v]().constructor.name;
                    if( type == "Array" || type == "Float32Array" )
                        type = (fsm.vars[v].length > 4 || !fsm.vars[v].length )? list : `vec${fsm.vars[v].length}`;
                    
                    types[`<Func> ${v}`] = {type:type, key:v};
                }

                if(!Object.keys(types).length)
                {
                    inspector.addInfo(null, " OOOPS! Did not found any variable registered for this FSM nor any trigger, please consider adding some first - ");
                    inspector.addSeparator();
                    return;
                }

                that._createcondtype = inspector.addCombo(
                    null, 
                    (that._createcondtype)? that._createcondtype.getValue() : Object.values(types)[0], 
                    { 
                        width:"calc(100% - 60px)",
                        values: types, 
                        callback: _ => inspector.refresh()
                    }
                );

                that._createcondoperator = inspector.addCombo(
                    null,
                    (that._createcondoperator)?that._createcondoperator.getValue() : "==", 
                    {
                        width:"60px",
                        values: ["==","!=","<=",">=",">","<"], 
                        callback: _ => inspector.refresh()
                    }
                )

                switch(that._createcondtype.getValue())
                {
                    case("boolean"): that._createcondtype.setValue("checkbox"); break;
                }

                let value = inspector.add(
                    that._createcondtype.getValue()?that._createcondtype.getValue().type : "Number", 
                    null , 
                    null,
                    {
                        width:"calc(100% - 60px)"
                    }
                );

                switch(that._createcondtype.getValue())
                {
                    case("vec2"):case("vec3"):case("vec4"):case("position"):{
                        value.getValue = function()
                        { 
                            return value.draggers.map( e => e.value );
                        }
                        break;
                    }
                }

                inspector.widgets_per_row = 2;

                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABOElEQVR4Ae3TgUYEYRSG4YW1diNCwAIGUJs5h7q3QIGQhAjdRyIt7EIQBF1FRBcwKXwso+KwZw7v+1/A/3zzmxEREREREREREW3W7ttpYf7hnr9557d1+a/efR+7LszXhKp8nYuqfJ32vCZfx87gw/+jZrc6/wV+UvATgg8f/mKnOv8ZflbwE4IP30/syWejQPNpIv/o2D698/V8GuCv8/jtD7/ThGp8/9CVmlCGvzjY4GtCFf7c33uuXv3/d/aZrTL4yu56rtcr5H/9wIRmks8PTbClJgyWH5jQTBL5gQni2zKbH5iQzw9NGCJf2c1vE/L5gQk+zufHJjz4eOh85Vd9TL/3xxA//xXK8DWhLl8TSvKVXZbma0JdvibU5WtCXb4m1OVrQl2+JhTla8J2+URERERERET0BTMPgAX3NpM4AAAAAElFTkSuQmCC"/>', 
                { width:"30px", callback: function(v) { 
                    //that.vars[name.getValue()] = value.getValue();
                    that.addCondition( 
                        that._createcondtype.getValue().key, 
                        that._createcondoperator.getValue(), 
                        value.getValue()
                    );
                    delete that._createcond; 
                    delete that._createcondtype; 
                    delete that._createcondoperator; 
                    inspector.refresh(); 
                }});
                
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABZUlEQVR4Ae2agWYDQRRFBxCxHxEAFsY8CwsW+r9pAdWgAvmdCttVmJJiIEzFO55wz/zAOWRj5s0kIYQQQgghhBBC/I9xsPc8JYA8lY9xSCy2t4vVcs0ToH+1ahfbs/pnq1Z9E5r+bZ2xhMPuT78lAPq3hMMO0S8nq1a9E5p+W+UEJNjRalstwVW/rWPyJi9l80/I8z39suUlNfCE+XF9W7v6fIKtecb1+QRcn0/A9fkEXJ9PwPXjE/JyT99WQB8Q6Yc7AH6IqD6fgOrzCag+n4Dq8wmYPp/gsAmMTsgvDtvwyAT7idR3OJzw+sxsgdfnE3h9PoHS5xMA/fgA+6IC9BMCPmL9jQL6fAKgXzb7jkxwmHF2ZqraTutAwx8pdaiPH6tosBU/WtRwN368rguO2CsmXfLFX7Pqott3xhmQUN589TsJr8/03GbuP7fRg6foJ2d69NcYh/IZ/+xSCCGEEEIIIYQQvw2UKo1mqKrvAAAAAElFTkSuQmCC"/>', 
                { width:"30px", callback: function(v) { 
                    delete that._createcond; 
                    delete that._createcondtype; 
                    delete that._createcondoperator; 
                    inspector.refresh() 
                }});

                inspector.widgets_per_row = 1;
            }
            
            else
            {
                inspector.widgets_per_row = 1;
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAAB9JREFUeAFjgIJRwP+BZM4oh/8/GHygIYd8h45yRgEAaHBnmaA4EHkAAAAASUVORK5CYII="/>', 
                { width:"30px", callback: function(v) { 
                    that._createcond = true;
                    inspector.refresh()
                }});
            }
            //var types = (["boolean","number","string", "vec2", "vec3", "vec4"]).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );
            //inspector.addCombo();
            inspector.addSeparator();
        }

        static registerTriggerFunc( name, func )
        {
            console.assert(name && func.constructor.name == "Function", "Invalid parameters when registering condition function , please check", window.DEBUG);
            FSMTransition.registered_funcs[name]  = func;
        }
    }
    FSMTransition.count = 0;
    FSMTransition.registered_funcs  = {};

})();(_=>{

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

})();(_=>{

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

})();(_=>{
        
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

})();(_=>{

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


(_=>{

    /***
     * ███████╗███████╗███╗   ███╗    ██████╗ ██╗      █████╗ ██╗   ██╗███████╗██████╗ 
     * ██╔════╝██╔════╝████╗ ████║    ██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗
     * █████╗  ███████╗██╔████╔██║    ██████╔╝██║     ███████║ ╚████╔╝ █████╗  ██████╔╝
     * ██╔══╝  ╚════██║██║╚██╔╝██║    ██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗
     * ██║     ███████║██║ ╚═╝ ██║    ██║     ███████╗██║  ██║   ██║   ███████╗██║  ██║
     * ╚═╝     ╚══════╝╚═╝     ╚═╝    ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
     * 
     * 
     * //TODO: check what happens with global / resource
     * //TODO: confirm resource management
     */

    "use strict";

    class FSMPlayer
    {
        constructor( o )
        {
            this.configure(o);
        }

        configure(o)
        {
            o = o || {};

            this.fsm_filename = o.fsm_filename || null;

            if(this.fsm_filename)
            {
                LS.ResourcesManager.load(this.fsm_filename, (function(res) {
                    console.assert( res, `Resource is empty`, window.DEBUG);
                    this._res = res;

                    for(var s in this._res.states){
                        delete this._res.states[s]._current;
                    }
                }).bind(this));   
            }

        }

        serialize(){
            let data = 
            {
               fsm_filename: this.fsm_filename,
            };
            return data;
        }

        onAddedToScene( scene )
        {
            LEvent.bind( scene, "start", this.onStart, this );
            LEvent.bind( scene, "update", this.onUpdate, this );
        }

        onRemovedFromScene( scene )
        {
            LEvent.unbindAll( scene, this );
        }

        onStart()
        {
            if(this._res)
                delete this._res;

            if( this.fsm_filename 
                && this.fsm_filename.constructor.name == "String" 
                && this.fsm_filename.length > 0 )
            {
                LS.ResourcesManager.load(this.fsm_filename, (function(res) {
                    console.assert( res, `Resource is empty`, window.DEBUG);
                    this._res = res;
                    this._res.onStart();
                }).bind(this));    
            }
            
        }

        onUpdate(event_name,dt){
            if(!this._res) return;

            this._res.onUpdate( dt );
        }

        //Resource related ------------------------------------------------
        
        getResources( res )
        {
            if(this.fsm_filename)
                res[ this.fsm_filename] = true;

            return res;
        }

        onResourceRenamed(old_name, new_name, resource)
        {
            if(this.fsm_filename == old_name)
                this.fsm_filename = new_name;
        }

        getPropertyInfoFromPath( path )
        {            
            /*var v = this;
            var param = "";
            for(var i in path){
                param = path[i];
                v = v[param];
            }*/

            /*var v, param, container;
            if( path[0] == "vars"){
                param = path[1];
                container = this.vars;
                v = container[param];
            }
            else if ( path[0] == "globalvars"){
                param = path[1];
                container = (a.hasOwnProperty(param))? this.vars : this.constructor.vars;
                v = container[param];
            }
            else {
                param = path[0];
                container = this;
                v = container[param];
            }

            var type = v.constructor.name;
            switch( type )
            {
                case "Number":case "String": case "Boolean": 
                    type = type.toLowerCase(); break;
                case "Float32Array": {
                    switch (v.length) {
                        case 2: type = "vec2"; break;
                        case 3: type = "vec2"; break;
                        case 4: type = "vec2"; break;
                        default: type = "array"; break;
                    }
                    break;
                }
                default: alert(`FSM BlackBoard param ${param} has a type not taken into account`);
            }

            return {
                name: param,
                node: this._root,
                target: container,
                type: type,
                value: v
            }*/
        }

        //------------------------------------------------------------------

        static "@inspector" ( component, inspector )
        {
            component._inspector = inspector;

            inspector.widgets_per_row = 4;
            inspector.addResource("Resource ", component.fsm_filename, { width:"calc(80% - 30px)", callback: v => { 
                component.fsm_filename = v;
                component.onStart();
                inspector.refresh();
            }}, "FSM");         

            if( !component.fsm_filename ) 
            {

                inspector.addButton(null, "New",  { width:"calc(20% - 30px)", callback: _ =>{
                    
                    let content = (new FSM()).toData();
                    DriveModule.showCreateFileDialog({
                        filename: "MyFSM.fsm",
                        folder: "",
                        content: content,
                        resource_type: "FSM"
                    }, res => {
                        component.fsm_filename = res.filename;
                        component._res = res;
                        inspector.refresh();
                    });
                    
                }});

                return;
            }

            if( component.fsm_filename && !component._res )
            {

                LS.ResourcesManager.load(component.fsm_filename, function(res) {
                    console.assert( res, `Resource is empty`, window.DEBUG);
                    component._res = res;
                    res.onStart();
                    inspector.refresh();
                });  

                return; 
            } 

            inspector.addButton(null, "Edit",  { width:"calc(20% - 30px)", callback: _ =>{
                if(!component._res){
                    LS.ResourcesManager.load(component.fsm_filename, function(res) {
                        console.assert( res, `Resource is empty`, window.DEBUG);
                        component._res = res;
                        res.onStart();
                        CORE.getModule("FSM").setFSM( component._res );
                        EditorModule.inspect( component._res );
                    });  
                }
                else
                {
                    CORE.getModule("FSM").setFSM( component._res );
                    EditorModule.inspect( component._res )
                }
            }});

            //Reload
            inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAADwklEQVR4Ae2aY5jGVhCFZ+3a9iK7+XLPqW23v2rbtm3btm3btm3bbWpN8i0nt83z3Hd+Z+ac6GokEAgEAoFAIBAIBKyIGjkr1sJBuIoP8zV8w6/4Oh/GVTgIayWzRI0yJLiT+COZGjvzZnzLtJ/4Grdg+3gcGRTchqn4oG90bsvHmQ46vsPZycyDke/BgJsUR/IrpkMP3M0lpVaqgE2YFm+ghusNUbyOp9081eQXbqAyIW5hahBXurGz8gs3wOX4KVOjeBuUv+C6TIs2UMfjmVoGvnXLKPnFGWArru9Xzgs8kxu5mX7/53d2xJ2cCytwW57Jl/qx8BO3VfKLMTBVE++tfh9xUtwp/cA+nMbvq15/A9PCDfC8KsW/4IG948og6J0Yh/Pr/CyFG3Bb55b5EvtGY8gQiCfitfRvAAvgp5wiz7hJh/cfw8deDVSmwefZArg8bpNhEo2HW/wZqMGjOQWOkloZAWzgeZ4MuNVz0p9gcFtO8mIgauf72SmA1MoIUfKLM4Dts59u1C4jhEd5+oijdn6iPt1v2GUl34MBbKrTYhdD+R4MPKLSvj5Vk5V8DwZcTybt5jIicDBTjwawh3p9Pu/sMJTvwcD9evCyk+/BQDKanv9UnJ18DwawmEr5gQwb7s3Uv4Gt1BdwgaV8DwZ4gkq5haV8DwZw678TuoWkXOAp9QpNJeWCr6uHOpaUC719NVGLlAu9bo0aS/4KdY0p5YJPl/wjxm3/NpAsLOUCJ6onsKWUC26jfqPnSblwi2cmc+UiatfTaVeRcoH71FdwpBQETlNP+3YRD0tKK9wE/L6QH0Yl0lNct5kUAA7SdfqmEBvwqPW2Su5O9Reqyh1iBTbR9wY7izE8S9dwq4sVE7XoKR2+iTvFkGTm7NGr6bQR25lu7iriNj6Tyb+u9Wjwni6Bq6RWLKjLObZ90Xza7lYzO+BQ8JRsZjePmFPDh+2PmKQWh+RkvViKIO7MO+TjFXHbCHb9bszJ+KlqiLLDLWR5zOqmxStMs+GWEU3RB934AvtyrCH+mPfDj7m5DpJiwTnVWw04/uDEc2V179WfrVCmasL9w232YEMyH07ml0yryWeDGGDSboMZf/+TT9bM8dGdzMKNeIWSruM8qRdP1OmVskEcJTXiEyzFT8zEf+1WE//0TmzU9PdgMrX8R9Rg/RG2Xb7lVjN6dfw3vvJTt4PBVrFZ6/FjQxL/KrY32GX11PytpR+ZzCe1/+P2+2SWP9rvH/qt/f73lsoXcSF3xGLxRGJEIBAIBAKBQCAQCPwM9/tgs3UybYkAAAAASUVORK5CYII="/>',
            { width:"30px",callback: _ => component.onStart() });
                           
            //Download
            inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABoklEQVR4Ae3ZgYYCURTG8RtoJCIA2h0ETLDnvFoAkoUNCMgu9AYBsBASBNL2HkEAbHdDPnbdoTnWnJHvO8BN+v8AFDiO4ziO47j/n8bfRwABBBBAAAEEEEAAAQQQQAABBBBAAAEEEPBQgJZOir4FUPR1ElrBe7LUqEftVQVoT48aZRl8p4tb4F579wGQv799sgh+k7lG3L7o3gsousi/nsyd83E7EEoAyN/h3Y+gbxpxIGinDJDOx73WDpCpxsRtb4QSgHaS+VGmITSKkAZc87e15CcDKhDyLPX9PCvLN/y+BXA/QdZ59vctz2Rdnu8FKCd8pl/S+a4AEAyHfE+AnYB8T4CdgHx/AAj2fH8ACPZ8fwAI9nxvAAj2fG8ACPZ8bwAI9nxvAAj2fGcACPZ8XwAI9nx/AAjI9wdYCcj3BtgIyPcH1DgCCCCAAAIIIOCssUF3rgyQQ5MA8lUZoLMmAXRWGfDyLN9Nyb+WPIXqk/fGAD6CZcO2HBqRfxi2g21FV1ZycY2/yAr/fdo2GuhYNnqqPf4kGx2PBoHjOI7jOI4r3Q+c8wi2Mf/1OgAAAABJRU5ErkJggg=="/>', 
            { width:"30px", callback: j => {
                if(!component.fsm_filename) return;

                LS.ResourcesManager.load(component.fsm_filename, function(res) {
                    if(!res) return;

                    let link = document.createElement("a");
                    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(res.toData()));
                    link.setAttribute('download', res.filename.substr(res.filename.lastIndexOf("/")+1));
                    if (document.createEvent) {
                        var event = document.createEvent('MouseEvents');
                        event.initEvent('click', true, true);
                        link.dispatchEvent(event);
                    }
                    else 
                        link.click();
                
                });  
            }});

            inspector.widgets_per_row = 2;

            inspector.addNumber("Nodes",        parseInt( Object.keys( component._res.states      ).length ).toString(), { disabled: true });
            inspector.addNumber("Transitions",  parseInt( Object.keys( component._res.transitions ).length ).toString(), { disabled: true });

            return;

            inspector.addSeparator();

            inspector.addTitle("Global BlackBoard");
            inspector.widgets_per_row = 2;
            component._res.constructor._widgets = component._res.constructor._widgets || {};
            for(let key in component._res.constructor.vars)
            {
                let value = component._res.constructor.vars[key];
                switch( value.constructor.name )
                {
                    case "Number":  component._res.constructor._widgets[key] = inspector.addNumber(key, value,  { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res.constructor, "globals/" + key), callback: (v) => { component._res.constructor.vars[key] = v; } }); break;
                    case "String":  component._res.constructor._widgets[key] = inspector.addString(key, value,  { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res.constructor, "globals/" + key), callback: (v) => { component._res.constructor.vars[key] = v; } }); break;
                    case "Boolean": component._res.constructor._widgets[key] = inspector.addCheckbox(key, value,{ width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res.constructor, "globals/" + key), callback: (v) => { component._res.constructor.vars[key] = v; } }); break;
                    case "Float32Array": {
                        switch (value.length) {
                            case 2: component._res.constructor._widgets[key] = inspector.addVector2(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res.constructor, "globals/" + key), callback: (v) => { component._res.constructor.vars[key] = v; } }); break;
                            case 3: component._res.constructor._widgets[key] = inspector.addVector3(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res.constructor, "globals/" + key), callback: (v) => { component._res.constructor.vars[key] = v; } }); break;
                            case 4: component._res.constructor._widgets[key] = inspector.addVector4(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res.constructor, "globals/" + key), callback: (v) => { component._res.constructor.vars[key] = v; } }); break;
                            default:component._res.constructor._widgets[key] = inspector.addList(key, value,    { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res.constructor, "globals/" + key) });
                        }
                        break;
                    }
                    default: component._res.constructor._widgets[key] = inspector.addString("!" + key, value.toString(),{ width:"calc(100% - 30px)"});
                }

                inspector.addButton(null, '<img style="width:100%; filter: contrast(4);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjUxRDQxMDYwNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjUxRDQxMDYxNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTFENDEwNUU1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTFENDEwNUY1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7KsC9jAAAABlBMVEX///////9VfPVsAAAAAnRSTlP/AOW3MEoAAAAsSURBVHjaYmBEAQxQigHOZYADuCyyYgYwhDKpzEWyhBHmECRHorkZBgACDAA92gCZG0I57gAAAABJRU5ErkJggg=="/>', 
                { width:"30px", callback: j => { 
                    var msg = "Proceed and remove the variable globaly?";
        
                    var dialog = new LiteGUI.Dialog({title:"WARNING!", close:false,  width: 300, height: 85, "min-heihgt":"85px", draggable: false});
                    var widgets = new LiteGUI.Inspector();
                    dialog.add(widgets);
                    
                    var that = this;
                    widgets.addInfo(null, msg, {disabled:true});
                    widgets.widgets_per_row = 2
                    widgets.addButton(null, "Ok", _=>{ 
                        dialog.close();
                        delete component._res.constructor._widgets[key];
                        delete component._res.constructor.vars[key];
                        inspector.refresh();
                    });
                    widgets.addButton(null, "Cancel", _=> dialog.close());
                    
                    dialog.show();

                }} );
            }

            if(component._res.constructor._createvar)
            {
                
                inspector.widgets_per_row = 2;
                inspector.addSeparator();
                var name = component._res.constructor._createvarname = inspector.addString( "New value", component._res.constructor._createvarname? component._res.constructor._createvarname.getValue() : `_var_${Object.keys(component._res.constructor.vars).length}`, { width:"72%", callback: v=>component._res.constructor._createvarname.setValue(v) } );
                
                var types = (["boolean","number","string", "vec2", "vec3", "vec4"]).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );//Object.values(LS.TYPES).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );
                component._res.constructor._createvartype = inspector.addCombo(null, (component._res.constructor._createvartype)?component._res.constructor._createvartype.getValue() : "number", 
                { width:"28%",values: types, callback: function(v) {  
                    inspector.refresh(); 
                } });
                    
                inspector.widgets_per_row = 3;
                switch(component._res.constructor._createvartype.getValue())
                {
                    case("boolean"): component._res.constructor._createvartype.setValue("checkbox"); break;
                }
                    
                let value = inspector.add(component._res.constructor._createvartype.getValue(), null , null, {width:"calc(100% - 60px)"});
                switch(component._res.constructor._createvartype.getValue())
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
                    component._res.constructor.vars[name.getValue()] = value.getValue();
                    delete component._res.constructor._createvar; delete component._res.constructor._createvartype; delete component._res.constructor._createvarname; inspector.refresh(); } 
                });
                
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABZUlEQVR4Ae2agWYDQRRFBxCxHxEAFsY8CwsW+r9pAdWgAvmdCttVmJJiIEzFO55wz/zAOWRj5s0kIYQQQgghhBBC/I9xsPc8JYA8lY9xSCy2t4vVcs0ToH+1ahfbs/pnq1Z9E5r+bZ2xhMPuT78lAPq3hMMO0S8nq1a9E5p+W+UEJNjRalstwVW/rWPyJi9l80/I8z39suUlNfCE+XF9W7v6fIKtecb1+QRcn0/A9fkEXJ9PwPXjE/JyT99WQB8Q6Yc7AH6IqD6fgOrzCag+n4Dq8wmYPp/gsAmMTsgvDtvwyAT7idR3OJzw+sxsgdfnE3h9PoHS5xMA/fgA+6IC9BMCPmL9jQL6fAKgXzb7jkxwmHF2ZqraTutAwx8pdaiPH6tosBU/WtRwN368rguO2CsmXfLFX7Pqott3xhmQUN589TsJr8/03GbuP7fRg6foJ2d69NcYh/IZ/+xSCCGEEEIIIYQQvw2UKo1mqKrvAAAAAElFTkSuQmCC"/>', 
                { width:"30px", callback: function(v) { delete component._res.constructor._createvar; delete component._res.constructor._createvartype; delete component._res.constructor._createvarname; inspector.refresh() } });
                
                inspector.addSeparator();
            }
            else
            {
                inspector.widgets_per_row = 1;
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAAB9JREFUeAFjgIJRwP+BZM4oh/8/GHygIYd8h45yRgEAaHBnmaA4EHkAAAAASUVORK5CYII="/>', 
                { width:"30px", callback: j => { 
                    component._res.constructor._createvar = true;
                    inspector.refresh()
                }});
            }


            inspector.widgets_per_row = 1;
            inspector.addTitle("Component BlackBoard");
            inspector.widgets_per_row = 2;
            component._res._widgets = component._res._widgets || {};
            for(let key in component._res.vars)
            {
                let value = component._res.vars[key];
                switch( value.constructor.name )
                {
                    case "Number":  component._res._widgets[key] = inspector.addNumber(key, value,  { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res, "vars/" + key), callback: (v) => { component._res.vars[key] = v; } }); break;
                    case "String":  component._res._widgets[key] = inspector.addString(key, value,  { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res, "vars/" + key), callback: (v) => { component._res.vars[key] = v; } }); break;
                    case "Boolean": component._res._widgets[key] = inspector.addCheckbox(key, value,{ width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res, "vars/" + key), callback: (v) => { component._res.vars[key] = v; } }); break;
                    case "Float32Array": {
                        switch (value.length) {
                            case 2: component._res._widgets[key] = inspector.addVector2(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res, "vars/" + key), callback: (v) => { component._res.vars[key] = v; } }); break;
                            case 3: component._res._widgets[key] = inspector.addVector3(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res, "vars/" + key), callback: (v) => { component._res.vars[key] = v; } }); break;
                            case 4: component._res._widgets[key] = inspector.addVector4(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res, "vars/" + key), callback: (v) => { component._res.vars[key] = v; } }); break;
                            default:component._res._widgets[key] = inspector.addList(key, value,    { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component._res, "vars/" + key) });
                        }
                        break;
                    }
                    default: component._res._widgets[key] = inspector.addString("!" + key, value.toString(), { width:"calc(100% - 30px)"});
                }

    
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjUxRDQxMDYwNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjUxRDQxMDYxNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTFENDEwNUU1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTFENDEwNUY1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7KsC9jAAAABlBMVEX///////9VfPVsAAAAAnRSTlP/AOW3MEoAAAAsSURBVHjaYmBEAQxQigHOZYADuCyyYgYwhDKpzEWyhBHmECRHorkZBgACDAA92gCZG0I57gAAAABJRU5ErkJggg=="/>', 
                { width:"30px", callback: j => { 
                    delete component._res._widgets[key];
                    delete component._res.vars[key];
                    inspector.refresh();
                }} );

            }

            if(component._res._createvar)
            {
                
                inspector.widgets_per_row = 2;
                inspector.addSeparator();
                let name = component._res._createvarname =  inspector.addString( "New value", component._res._createvarname? component._res._createvarname.getValue() : `_var_${Object.keys(component._res.vars).length}`, { width:"72%", callback: v=>component._res._createvarname.setValue(v) } );
                
                var types = (["boolean","number","string", "vec2", "vec3", "vec4"]).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );;//Object.values(LS.TYPES).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );
                component._res._createvartype = inspector.addCombo(null, (component._res._createvartype)?component._res._createvartype.getValue() : "number", 
                { width:"28%",values: types, callback: function(v) {  inspector.refresh(); } });
                    
                inspector.widgets_per_row = 3;
                switch(component._res._createvartype.getValue())
                {
                    case("boolean"): component._res._createvartype.setValue("checkbox"); break;
                }
                    
                let value = inspector.add(component._res._createvartype.getValue(), null , null, {width:"calc(100% - 60px)"});
                switch(component._res._createvartype.getValue())
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
                    component._res.vars[name.getValue()] = value.getValue();
                    delete component._res._createvar; delete component._res._createvartype; inspector.refresh(); } 
                });
                
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABZUlEQVR4Ae2agWYDQRRFBxCxHxEAFsY8CwsW+r9pAdWgAvmdCttVmJJiIEzFO55wz/zAOWRj5s0kIYQQQgghhBBC/I9xsPc8JYA8lY9xSCy2t4vVcs0ToH+1ahfbs/pnq1Z9E5r+bZ2xhMPuT78lAPq3hMMO0S8nq1a9E5p+W+UEJNjRalstwVW/rWPyJi9l80/I8z39suUlNfCE+XF9W7v6fIKtecb1+QRcn0/A9fkEXJ9PwPXjE/JyT99WQB8Q6Yc7AH6IqD6fgOrzCag+n4Dq8wmYPp/gsAmMTsgvDtvwyAT7idR3OJzw+sxsgdfnE3h9PoHS5xMA/fgA+6IC9BMCPmL9jQL6fAKgXzb7jkxwmHF2ZqraTutAwx8pdaiPH6tosBU/WtRwN368rguO2CsmXfLFX7Pqott3xhmQUN589TsJr8/03GbuP7fRg6foJ2d69NcYh/IZ/+xSCCGEEEIIIYQQvw2UKo1mqKrvAAAAAElFTkSuQmCC"/>', 
                { width:"30px", callback: function(v) { delete component._res._createvar; delete component._res._createvartype; inspector.refresh() } });
                
            }
            else
            {
                inspector.widgets_per_row = 1;
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAAB9JREFUeAFjgIJRwP+BZM4oh/8/GHygIYd8h45yRgEAaHBnmaA4EHkAAAAASUVORK5CYII="/>', 
                { width:"30px", callback: j => { 
                    component._res._createvar = true;
                    inspector.refresh()
                }});
            }

            if(!component._res.onVarChanged)
            {
                component._res.onVarChanged = (property, value) => {
                    if(component._res._widgets[property]
                    && component._res._widgets[property].getValue() != value )
                    {
                        component._res._widgets[property].setValue( value );
                        inspector.refresh();
                    }
                }
            }

            if(!component._res.constructor.onGlobalChanged)
            {
                component._res.onGlobalChanged = (property, value) => {
                    if(component._res.constructor._widgets[property]
                    && component._res.constructor._widgets[property].getValue() != value )
                    {
                        component._res.constructor._widgets[property].setValue( value );
                        inspector.refresh();
                    }
                }
            }

            component.onNodeAdded 
            = component.onNodeRemoved 
            = component.onTransitionAdded 
            = component.onTransitionRemoved 
            = _ => {
                inspector.refresh();
            }
        }
    }
    FSMPlayer["@fsm_filename"] = { widget: "resource", resource_classname:"FSM" };

    
    if(LS)
    {   
        if(LS.Components["FSMPlayer"])
            LS.unregisterComponent("FSMPlayer");
        LS.registerComponent( FSMPlayer );
    }

})();(_=>{

    /*** 
     * ███████╗███████╗███╗   ███╗    ███████╗██████╗ ██╗████████╗ ██████╗ ██████╗ 
     * ██╔════╝██╔════╝████╗ ████║    ██╔════╝██╔══██╗██║╚══██╔══╝██╔═══██╗██╔══██╗
     * █████╗  ███████╗██╔████╔██║    █████╗  ██║  ██║██║   ██║   ██║   ██║██████╔╝
     * ██╔══╝  ╚════██║██║╚██╔╝██║    ██╔══╝  ██║  ██║██║   ██║   ██║   ██║██╔══██╗
     * ██║     ███████║██║ ╚═╝ ██║    ███████╗██████╔╝██║   ██║   ╚██████╔╝██║  ██║
     * ╚═╝     ╚══════╝╚═╝     ╚═╝    ╚══════╝╚═════╝ ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
     */                                                                                            

    "use strict";

    window.FSMEditor = class FSMEditor
    {
        constructor( canvas )
        {
            this.alpha = 0.75;
            this.canvas = canvas;
            this.mouse = [0,0];
            this.last_mouse_position = [0, 0];
            this.ds = new DragAndScale(this.canvas, false);
            this.ds.onmouse = this.onMouse.bind(this);
            this.init();
            this.selectedNodes = [];
            this.selectedTransitions = [];
            this._keys = [];
        }

        init()
        {
            this.bindEvents();
        }

        stop()
        {
            this.unbindEvents();
        }

        /*************************************************************
         *  EVENTS
         ************************************************************/

        bindEvents()
        {
            if(this._events_binded) return;
            let canvas = this.canvas;

            this._mousemove_callback  = this.onMouseMove.bind(this);
            this._mouseup_callback    = this.onMouseUp.bind(this);
            this._mousedown_callback  = this.onMouseDown.bind(this);
            this._mousewheel_callback = this.onMouseWheel.bind(this);
            this._key_callback        = this.processKey.bind(this);
            this._ondrop_callback     = this.processDrop.bind(this);


            canvas.addEventListener("mousedown",     this._mousedown_callback, true);
            //canvas.addEventListener("mousemove",     this._mousemove_callback);
            canvas.addEventListener("mousewheel",    this._mousewheel_callback, false);
            canvas.addEventListener("contextmenu",   this._doNothing);
            canvas.addEventListener("DOMMouseScroll",this._mousewheel_callback,false);
            canvas.addEventListener("touchstart",    this.touchHandler, true);
            canvas.addEventListener("touchmove",     this.touchHandler, true);
            canvas.addEventListener("touchend",      this.touchHandler, true);
            canvas.addEventListener("touchcancel",   this.touchHandler, true);
            document.addEventListener("keyup", this._key_callback, true); //in document, otherwise it doesn't fire keyup
            document.addEventListener("keydown", this._key_callback, true);
            canvas.addEventListener("dragover", this._doNothing, false);
            canvas.addEventListener("dragend", this._doNothing, false);
            canvas.addEventListener("drop", this._ondrop_callback, false);
            canvas.addEventListener("dragenter", this._doReturnTrue, false);
    
            this._events_binded = true;
        }

        unbindEvents()
        {
            if(!this._events_binded) return;

            var ref_window = this.getCanvasWindow();
            var document = ref_window.document;
    
            this.canvas.removeEventListener("mousedown",    this._mousedown_callback);
            this.canvas.removeEventListener("mousewheel",   this._mousewheel_callback);
            this.canvas.removeEventListener("DOMMouseScroll",this._mousewheel_callback);

               document.removeEventListener("keyup",        this._key_callback);
               document.removeEventListener("keydown",      this._key_callback);
            this.canvas.removeEventListener("contextmenu",  this._doNothing);
            this.canvas.removeEventListener("drop",         this._ondrop_callback);
            this.canvas.removeEventListener("dragenter",    this._doReturnTrue);
    
            this.canvas.removeEventListener("touchstart",   this.touchHandler);
            this.canvas.removeEventListener("touchmove",    this.touchHandler);
            this.canvas.removeEventListener("touchend",     this.touchHandler);
            this.canvas.removeEventListener("touchcancel",  this.touchHandler);
    
            this._mousedown_callback  = null;
            this._mouseup_callback    = null;
            this._mousemove_callback  = null;
            this._mousewheel_callback = null;
            
            this._key_callback        = null;
            this._ondrop_callback     = null;

            this._events_binded = false;
        }

        _doNothing(e)
        {
            e.preventDefault();
            return false;
        };
        
        _doReturnTrue(e) 
        {
            e.preventDefault();
            return true;
        };

        adjustMouseEvent( e )
        {
            if (this.canvas) {
                var b = this.canvas.getBoundingClientRect();
                e.localX = e.clientX - b.left;
                e.localY = e.clientY - b.top;
            } else {
                e.localX = e.clientX;
                e.localY = e.clientY;
            }
    
            e.deltaX = e.localX - this.last_mouse_position[0];
            e.deltaY = e.localY - this.last_mouse_position[1];
    
            this.last_mouse_position[0] = e.localX;
            this.last_mouse_position[1] = e.localY;
    
            e.canvasX = e.localX / this.ds.scale - this.ds.offset[0];
            e.canvasY = e.localY / this.ds.scale - this.ds.offset[1];
        } 

        onMouse(e)
        {
            if(e.type == "mousemove")
            {
                this.adjustMouseEvent(e);

                this.mouse[0] =e.canvasX; 
                this.mouse[1] =e.canvasY;

                for(let i in this.fsm.transitions)
                {
                    let t =  this.fsm.transitions[i];
                    
                    if(t._t && t._from && t.to)
                    {
                        let from = vec2.add(vec2.create(), t._from, t._t);
                        let to   = vec2.add(vec2.create(), t._to,   t._t);

                        t._hover = this.isPointInsideWideLine( e.canvasX, e.canvasY, from, to, 3) && !this.getNodeOnPos(e.canvasX, e.canvasY, [this.fsm.states[t.from],this.fsm.states[t.to]], 0);
                    }
                }
    
                return !!this.selectedNodes.length && e.which == 1;
            }
        }
        
        onMouseMove( e )
        {
            this.adjustMouseEvent(e);

            if(e.which != 1) return;
            for( let n in this.selectedNodes )
            {
                this.selectedNodes[n].pos[0] += e.deltaX / this.ds.scale;
                this.selectedNodes[n].pos[1] += e.deltaY / this.ds.scale;
            }

            
        }
        
        onMouseUp( e )
        {

        }

        onMouseDown( e )
        {
            if(!this.fsm) return;
            this.adjustMouseEvent(e);
            
            let ref_window = this.getCanvasWindow();
            let document = ref_window.document;
            FSMEditor.active_canvas = this;
            let that = this;

                 this.canvas.removeEventListener("mousemove", this._mousemove_callback);
            ref_window.document.addEventListener("mousemove", this._mousemove_callback, true);
            ref_window.document.addEventListener("mouseup",   this._mouseup_callback, true);

            let node = this.getNodeOnPos(e.canvasX, e.canvasY, this.visible_nodes, 5);
            let transition = this.getTransitionOnPos(e.canvasX, e.canvasY, null, 3);
            let now = LiteGraph.getTime();
            let is_double_click = now - this.last_mouseclick < 300;
            this.last_mouseclick = now;

            //this.mouse[0] = e.canvasX;
            //this.mouse[1] = e.canvasY;
            this.canvas.focus();

            this.closeAllContextMenus(ref_window);

            switch( e.which )
            {
                case( 1 ): //left mouse button
                {
                    if(!this._keys["Control"] && !( node && this.selectedNodes.includes( node )) )
                        this.selectedNodes = [];
                    if( node && !this.selectedNodes.includes( node ) ){
                        if(this.selectedTransitions.length)this.selectedTransitions = [];
                        this.selectedNodes.push( node );
                    }

                    if(!this._keys["Control"] && !( transition && this.selectedTransitions.includes( transition )) )
                        this.selectedTransitions = [];
                    if( transition && !node && !this.selectedTransitions.includes( transition )){
                        if(this.selectedNodes.length)this.selectedNodes = [];
                        this.selectedTransitions.push( transition );
                    }

                         if(is_double_click && node)         EditorModule.inspect( Object.assign(node, {_fsm:this.fsm}) );
                    else if(is_double_click && transition)   EditorModule.inspect( Object.assign(transition, {_fsm:this.fsm}) ); 
                    else if(is_double_click)                 EditorModule.inspect( this.fsm ); 


                    break;
                }
                case( 2 ): //Wheel mouse button
                {
                    break;
                }
                case( 3 ): //right mouse button
                {   
                    this.processContextMenu( node, transition, e ); 
                    break;
                }
                default:
                    console.log(e.which);
            }

            //this.canvas.addEventListener("mousemove",     this._mousemove_callback);

        }

        onMouseUp( e )
        {
            //this.canvas.removeEventListener("mousemove",     this._mousemove_callback);

            let ref_window = this.getCanvasWindow();
                    this.canvas.removeEventListener("mousemove", this._mousemove_callback);
            ref_window.document.removeEventListener("mousemove", this._mousemove_callback, true);
            //ref_window.document.addEventListener("mouseup",   this._mouseup_callback, true);
        }

        onMouseWheel( e )
        {
            
        } 

        processKey( e )
        {
            //console.log( e.type, e );
            //this._o_keys[e.key] = this._keys[e.key];
            this._keys[e.key] = e.type == "keyup"? 0 : 1;

            switch( e.key ){
                case "Delete": {
                    e.stopPropagation();
                    this.removeNodes( this.selectedNodes );
                    this.removeTransitions( this.selectedTransitions );
                    this.selectedNodes = [];
                    this.selectedTransitions = [];
                    break;
                }

                case "Escape":
                {
                    EditorModule.inspect( this.fsm );
                    break;
                }
            }
        }
        

        processDrop( e )
        {

        }
        /*************************************************************
         * GUI related Functions
         ************************************************************/
        removeNodes( nodes )
        {
            if(!Array.isArray(nodes))
                return console.error(`removeNodes expects an array of nodes`);

            var has_changed = 0;
            for(var i in nodes){
                if(Object.values(FSMNode.NODE_TYPES).includes(nodes[i].constructor))
                    has_changed |= this.fsm.removeNode( nodes[i].id );
                else
                    has_changed |= this.fsm.removeNode( nodes[i] );
            }
                

            if(has_changed){
                LS.RM.resourceModified(this.fsm);
                if(EditorModule && EditorModule.inspector)
                    EditorModule.inspector.onRefresh()
            }
        }

        removeTransitions( transitions )
        {
            if(!Array.isArray(transitions))
            return console.error(`removeTransition expects an array of transitions`);
            
            var has_changed = 0;
            for(var i in transitions )
            {
                if(transitions[i].constructor.name == "FSMTransition")
                    has_changed |= this.fsm.removeTransition( transitions[i].id );
                else
                    has_changed |= this.fsm.removeTransition( transitions[i] );
            }
            
            if(has_changed){
                LS.RM.resourceModified(this.fsm);
                if(EditorModule && EditorModule.inspector)
                    EditorModule.inspector.onRefresh()
            }
        }
        
        createNode(type, name, options)
        {
            let node = FSMNode.createNode(type, name, options);
            if(node){
                this.fsm.addNode( node );
                LS.RM.resourceModified(this.fsm);
                if(EditorModule && EditorModule.inspector){
                    EditorModule.inspector.inspect(node);
                }
            }
        }

        setDefault( id )
        {
            let node = this.fsm.states[id];
            if(!node) 
                return;

            this.fsm.default = id;
            LS.RM.resourceModified(this.fsm);
        }

        createTransition( nodeID )
        {
            

            this.canvas.removeEventListener("mousedown",    this._mousedown_callback);
            
            this.selectedNodes = [];
            this.selectedTransitions = [];

            this._temp_transition = nodeID;

            this._create_transition_callback = ( e => 
            {
                this.adjustMouseEvent(e);
                let node = this.getNodeOnPos(e.canvasX, e.canvasY, this.visible_nodes, 5);
                if(!node) return;

                console.assert(node.name != "any", `The "any" state only accepts outgoing transitions`, window.DEBUG);

                if(node && node.id != nodeID && node.name != "any")
                {
                    let transition = new FSMTransition({ from: nodeID, to: node.id});
                    this.fsm.addTransition( transition );
                    if(EditorModule && EditorModule.inspector)
                        EditorModule.inspector.inspect(transition);
                }
                delete this._temp_transition;

                document.addEventListener("keydown",this._key_callback,true);
                document.addEventListener("keyup",  this._key_callback,true);
                document.removeEventListener("keydown",   this._cancel_create_transition_callback);

                this.canvas.removeEventListener("mousedown",  this._create_transition_callback, true);
                this.canvas.addEventListener("mousedown",     this._mousedown_callback, true);

                LS.RM.resourceModified(this.fsm);
               
                
            }).bind(this);

            this._cancel_create_transition_callback = ( e => 
            {
                delete this._temp_transition

                document.addEventListener("keydown",this._key_callback,true);
                document.addEventListener("keyup",  this._key_callback,true);
                document.removeEventListener("keydown",   this._cancel_create_transition_callback);

                this.canvas.removeEventListener("mousedown",  this._create_transition_callback, true);
                this.canvas.addEventListener("mousedown",     this._mousedown_callback, true);
            }).bind(this);


            document.removeEventListener("keydown",this._key_callback);
            document.removeEventListener("keyup",  this._key_callback);
            document.addEventListener("keydown",   this._cancel_create_transition_callback, true);

            this.canvas.removeEventListener("mousedown",     this._mousedown_callback);
            this.canvas.addEventListener("mousedown",     this._create_transition_callback, true);
        }

        onShowNodePanel( node )
        {
            let inspector = this.inspector || EditorModule.inspector;
            inspector.inspect( node, false, node.constructor.type );
            this.inspected_node;
        }
        
        processContextMenu( node, transition, event )
        {
            let actions = [];

            /*
                { title: "extra/option1", callback: _=>console.log("option1") },
                { title: "extra/option2", callback: _=>console.log("option2") },
                { title: "extra/option3", callback: _=>console.log("option3") },
                { title: "extra/option4", callback: _=>console.log("option4") },
            */

            let options = {
                parentMenu: null,
                title: "FSM",
                callback:null,
                ignore_item_callbacks:false,
                event: event,
                autoopen: false,
                //left:0,
                //top:0,
            };

            if(node){
                actions = actions.concat([
                    { title: "Create Transition", callback: _=> this.createTransition( node.id ) },
                    { title: "Set Default", callback: _=> this.setDefault(node.id) },
                    { title: "Remove Node", callback: _=> this.removeNodes([node.id]) },
                ]);
            }else if( transition ){
                actions = actions.concat([
                    { title: "Remove Transition", callback: _=> this.removeTransitions( [transition.id] ) },
                ]);
            }else{ //Any other place in canvas
                actions = actions.concat([
                    { title: "Create Node", callback: _=> {
                        this.createNode("animation/playAnimation", null, {pos:[event.canvasX, event.canvasY],size:[120,30]});
                        
                    }},
                    { title: "Clear Graph", callback: async _=>{

                        var dialog = new LiteGUI.Dialog({title:"WARNING!", close:false,  width: 300, height: 120, draggable: false});
                        var widgets = new LiteGUI.Inspector();
                        dialog.add(widgets);

                        var that = this;
                        widgets.addInfo(null, "If you continue, all the contents of the FSM will be lost and you wont be able to restore it unless you manually load a previous saved version. <br/> Do you agree to proceed and clear the graph?", {disabled:true});
                        widgets.widgets_per_row = 2
                        widgets.addButton(null, "Clear", _=>{ that.removeNodes( Object.values(that.fsm.states)); dialog.close(); });
                        widgets.addButton(null, "Cancel", _=> dialog.close());
  
                        dialog.show();
                     }},
                ]);
            }

            this.contextMenu = new LiteGUI.ContextMenu( actions, options );
        }

        closeAllContextMenus( ref_window )
        {
            ref_window = ref_window || window;

            var elements = ref_window.document.querySelectorAll(".litecontextmenu");
            if (!elements.length) return;
    
            var result = [];
            for (var i = 0; i < elements.length; i++) result.push(elements[i]);
    
            for (var i in result) {
                if (result[i].close) result[i].close();
                else if (result[i].parentNode)
                    result[i].parentNode.removeChild(result[i]);
            }
        }
        /*************************************************************
         * Canvas related Functions
         ************************************************************/
        shouldDraw()
        {
            if (!this.fsm || !this.canvas || this.pause_rendering || this.is_rendering)
                return false;
    
            if (!this.ctx) {
                this.ctx = this.canvas.getContext("2d");
                if (!this.ctx) return false;
            }
        
            return true;
        }

        draw( canvas )
        {
            if( !canvas ) 
                canvas = this.canvas;
            
            if (!this.shouldDraw()) return;
    
            if( canvas != this.canvas )
            {
                this.unbindEvents();
                this.canvas = canvas;
                this.bindEvents();
            }

            let ctx = this.ctx;
         
            this.is_rendering = true;

            this.ds.computeVisibleArea();

            ctx.save();

            this.ds.toCanvasContext(ctx);

            this.drawBackground();

            //Render Transitions
            {
                for(let i in this.fsm.transitions)
                {
                    let t =  this.fsm.transitions[i];
                    
                    if(t._t && t._from && t.to)
                    {
                        let from = vec2.add(vec2.create(), t._from, t._t);
                        let to   = vec2.add(vec2.create(), t._to,   t._t);
                        //t.hover = this.isPointInsideWideLine( this.mouse[0], this.mouse[1], from, to, 3);
                        t._selected = this.selectedTransitions.includes( t ) || false;
                    }
                    t.draw( this.ctx, this.fsm );
                }

                 //Draw the temporal transition while is being created
                 if(this._temp_transition && this.fsm.states[this._temp_transition])
                 {

                     let from = this.fsm.states[this._temp_transition].pos;
                     let to   = this.mouse;
                     
                     let tmpV3 = vec3.create();
                     let dir = vec2.normalize(tmpV3,vec2.sub(tmpV3, to, from));
                     vec3.mul(tmpV3, [5, 5, 5], vec3.cross(tmpV3, dir, [0, 0, 1]));
                     from = vec2.add(vec2.create(), from, tmpV3);
                     

                     ctx.strokeStyle = "rgb(155, 155, 155)"; 
                     ctx.fillStyle = "rgb(155, 155, 155)";

                     //Draw the line
                     {
                         ctx.beginPath();
                         ctx.moveTo( from[0], from[1] );
                         ctx.lineTo( to[0],   to[1]   );
                         ctx.stroke();
                     }
                     
                     //Draw direction triangle
                     {
                         let dir = [(to[0]-from[0])*.5,(to[1]-from[1])*.5];
                         let p = vec2.add(vec2.create(), [from[0],from[1]], dir);
                         
                         let front = vec2.normalize(vec2.create(), dir);     vec2.mul(front, front, [3,3]);
                         let right = vec2.normalize(vec2.create(), tmpV3);   vec2.mul(right, right, [3,3]);
                         
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
            }
            
            //Render States
            {
                ctx.alpha = this.alpha;

                for(let i in this.fsm.states)
                {
                    let state = this.fsm.states[i];

                    var fgcolor =
                        state.color ||
                        state.constructor.color ||
                        FSMEditor.NODE_DEFAULT_COLOR;
                    var bgcolor =
                        (this.fsm._current == state.id? FSMEditor.NODE_CURRENT_NODE_COLOR : null) ||
                        (this.fsm.default  == state.id? FSMEditor.NODE_STARTING_NODE_COLOR : null) ||
                        state.bgcolor ||
                        state.constructor.bgcolor ||
                        FSMEditor.NODE_DEFAULT_BGCOLOR;
                    var selected = this.selectedNodes.includes( state ) || false;
                    var mouse_over = false;

                    state._selected = selected;

                    ctx.save();
                    ctx.translate(state.pos[0] - state.size[0]*0.5, state.pos[1] - (state.size[1]-30)*0.5);
    
                    //Set context to draw shadows
                    if (this.render_shadows || true) {
                        ctx.shadowColor = FSMEditor.DEFAULT_SHADOW_COLOR;
                        ctx.shadowOffsetX = 2 * this.ds.scale;
                        ctx.shadowOffsetY = 2 * this.ds.scale;
                        ctx.shadowBlur =    3 * this.ds.scale;
                    } else
                        ctx.shadowColor = "transparent";


                    //Draw
                    state.draw( ctx, fgcolor, bgcolor, selected, mouse_over );
                    
                    //drawn_nodes += 1;
    
                    //Restore
                    ctx.restore();
                    
                }
            }

            ctx.restore();

            //this.afterDraw();
            
            this.is_rendering = false;   
        }
        
        drawBackground()
        {
            this.background_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII=";
            if(!this.bg_img || ( !this.bg_img.loading && !this.bg_img.ready ) )
            {
                this.bg_img      = new Image();
                this.bg_img.name = this.background_image;
                this.bg_img.src  = this.background_image;
                this.bg_img.loading = true;
                var that = this;
                this.bg_img.onload = function() {
                    that.bg_img.loading = false;
                    that.bg_img.ready = true;
                };
                return;
            }

            //this.ctx.start();
            let ctx = this.ctx;

            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.clearRect(
                this.ds.visible_area[0],
                this.ds.visible_area[1],
                this.ds.visible_area[2],
                this.ds.visible_area[3]
            );
            if(!this._pattern)
                this._pattern = ctx.createPattern(this.bg_img, "repeat");
            
            if(this.ds.scale > 0.5)
            {
                ctx.fillStyle = this._pattern;
            }
            else
            {
                ctx.fillStyle = "rgba(34, 34, 34, 1)";
            }
            ctx.fillRect(
                this.ds.visible_area[0],
                this.ds.visible_area[1],
                this.ds.visible_area[2],
                this.ds.visible_area[3]
            );
            ctx.fillStyle = "transparent";



        }        

        /*************************************************************
         *  FSM related Functions
         ************************************************************/
        setFSM( fsm )
        {
            console.log( fsm );
            this.fsm = fsm;
        } 



        /*************************************************************
         *  Inspector related Functions
         ************************************************************/
        /*static inspect( whatever )
        {}

        onInspect( widget )
        {}*/
        getTransitionOnPos(x, y, transitions_list, margin)
        {
            transitions_list = transitions_list || Object.values(this.fsm.transitions);
            for(let i in transitions_list)
            {
                let t = transitions_list[i];
                let from = vec2.add(vec2.create(), t._from, t._t);
                let to   = vec2.add(vec2.create(), t._to,   t._t);
                if(this.isPointInsideWideLine( x, y, from, to, margin))
                    return transitions_list[i];
            }
            return null;
        }

        closestPoint2Line(p, a, b)
        {
            let ab = vec2.sub(vec2.create(), b, a);
            let ap = vec2.sub(vec2.create(), p, a);
            let ab2 = ab[0]*ab[0] + ab[1]*ab[1];
            let APdotAB = vec2.dot(ab, ap);
            let t = APdotAB / ab2;

            let v =  vec2.mul(vec2.create(), ab, [t,t]); vec2.add(v, v, a);
            let va = vec2.sub(vec2.create(), a, v);
            let vb = vec2.sub(vec2.create(), b, v);

            if(  vec2.length(vec2.add(vec2.create(),va, vb)) >  vec2.length(ab))
                return (vec2.length(va) > vec2.length(vb))? b : a;

            return v;
        }

        isPointInsideWideLine( x, y, a, b, bias )
        {
            let v = this.closestPoint2Line( [x,y], a, b);
            if(v == a || v == b ) return false;
            let d = vec2.dist([x,y],v);
            return d <= bias;
        }

        getNodeOnPos( x, y, nodes_list, margin )
        {
            nodes_list = nodes_list || Object.values(this.fsm.states);
            for (let i = nodes_list.length - 1; i >= 0; i--) 
            {
                let n = nodes_list[i];
                if ( this.isPointInside(n, x, y, margin) ) 
                    return n;
            }
            return null;
        }

        isPointInside( node, x, y, margin = 0, skip_tittle = false)
        {
            if(node.flags && node.flags.collapsed)
            {
                let left   = node.pos[0] - margin, 
                    top    = node.pos[1] - FSMEditor.NODE_TITLE_HEIGHT - margin, 
                    width  =  (node._collapsed_width || FSMEditor.NODE_COLLAPSED_WIDTH) + 2 * margin, 
                    height = FSMEditor.NODE_TITLE_HEIGHT + 2 * margin;
                if(this.isInsideRectangle(x,y, left, top, width, height)) 
                    return true;
            }
            else if (
                x > node.pos[0] - node.size[0] * .5 - margin &&
                x < node.pos[0] + node.size[0] * .5 + margin &&
                y > node.pos[1] - (node.size[1] + FSMEditor.NODE_TITLE_HEIGHT) * .5 - margin &&
                y < node.pos[1] + (node.size[1] + FSMEditor.NODE_TITLE_HEIGHT) * .5 + margin
            )return true;
            
            return false;
        }

        isInsideRectangle( x, y, left, top, width, height )
        {
            return (left < x && left + width > x && top < y && top + height > y);
        }


        /*processContextMenu( ref_window )
        {
            ref_window = ref_window || window;

            var elements = ref_window.document.querySelectorAll(".litecontextmenu");
            if (!elements.length) return;
    
            var result = [];
            for (var i = 0; i < elements.length; i++) 
                result.push(elements[i]);
    
            for (var i in result) 
            {
                if (result[i].close) 
                    result[i].close();
                else if (result[i].parentNode)
                    result[i].parentNode.removeChild(result[i]);
            }
        }*/

        getCanvasWindow()
        {
            if (!this.canvas) return window;
            var doc = this.canvas.ownerDocument;
            return doc.defaultView || doc.parentWindow;
        }
       

    }
    FSMEditor.NODE_COLLAPSED_WIDTH = 0;
    FSMEditor.NODE_TITLE_HEIGHT = 0;
    FSMEditor.NODE_DEFAULT_COLOR = "#333";
    FSMEditor.NODE_DEFAULT_BGCOLOR = "#353535";
    FSMEditor.NODE_STARTING_NODE_COLOR = "#e5a34e";
    FSMEditor.NODE_CURRENT_NODE_COLOR = "#ff9400";
    //FSMEditor.NODE_STARTING_NODE_COLOR = "#9f6619";
    FSMEditor.DEFAULT_SHADOW_COLOR = "rgba(0,0,0,0.5)";

    //Scale and Offset
    function DragAndScale(element, skip_events) {
        this.offset = new Float32Array([0, 0]);
        this.scale = 1;
        this.max_scale = 10;
        this.min_scale = 0.1;
        this.onredraw = null;
        this.enabled = true;
        this.last_mouse = [0, 0];
        this.element = null;
        this.visible_area = new Float32Array(4);

        if (element) {
            this.element = element;
            if (!skip_events) this.bindEvents(element);
        }
    }

    LiteGraph.DragAndScale = DragAndScale;

    DragAndScale.prototype.bindEvents = function(element) {
        this.last_mouse = new Float32Array(2);

        this._binded_mouse_callback = this.onMouse.bind(this);

        element.addEventListener("mousedown", this._binded_mouse_callback);
        element.addEventListener("mousemove", this._binded_mouse_callback);

        element.addEventListener(
            "mousewheel",
            this._binded_mouse_callback,
            false
        );
        element.addEventListener("wheel", this._binded_mouse_callback, false);
    };

    DragAndScale.prototype.computeVisibleArea = function() {
        if (!this.element) {
            this.visible_area[0] = this.visible_area[1] = this.visible_area[2] = this.visible_area[3] = 0;
            return;
        }
        var width = this.element.width;
        var height = this.element.height;
        var startx = -this.offset[0];
        var starty = -this.offset[1];
        var endx = startx + width / this.scale;
        var endy = starty + height / this.scale;
        this.visible_area[0] = startx;
        this.visible_area[1] = starty;
        this.visible_area[2] = endx - startx;
        this.visible_area[3] = endy - starty;
    };

    DragAndScale.prototype.onMouse = function(e) {
        if (!this.enabled) return;

        var canvas = this.element;
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        e.canvasx = x;
        e.canvasy = y;
        e.dragging = this.dragging;

        var ignore = false;
        if (this.onmouse) ignore = this.onmouse(e);

        if (e.type == "mousedown") {
            this.dragging = true;
            canvas.removeEventListener(
                "mousemove",
                this._binded_mouse_callback
            );
            document.body.addEventListener(
                "mousemove",
                this._binded_mouse_callback
            );
            document.body.addEventListener(
                "mouseup",
                this._binded_mouse_callback
            );
        } else if (e.type == "mousemove") {
            if (!ignore) {
                var deltax = x - this.last_mouse[0];
                var deltay = y - this.last_mouse[1];
                if (this.dragging) this.mouseDrag(deltax, deltay);
            }
        } else if (e.type == "mouseup") {
            this.dragging = false;
            document.body.removeEventListener(
                "mousemove",
                this._binded_mouse_callback
            );
            document.body.removeEventListener(
                "mouseup",
                this._binded_mouse_callback
            );
            canvas.addEventListener("mousemove", this._binded_mouse_callback);
        } else if (
            e.type == "mousewheel" ||
            e.type == "wheel" ||
            e.type == "DOMMouseScroll"
        ) {
            e.eventType = "mousewheel";
            if (e.type == "wheel") e.wheel = -e.deltaY;
            else
                e.wheel =
                    e.wheelDeltaY != null ? e.wheelDeltaY : e.detail * -60;

            //from stack overflow
            e.delta = e.wheelDelta
                ? e.wheelDelta / 40
                : e.deltaY
                ? -e.deltaY / 3
                : 0;
            this.changeDeltaScale(1.0 + e.delta * 0.05);
        }

        this.last_mouse[0] = x;
        this.last_mouse[1] = y;

        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    DragAndScale.prototype.toCanvasContext = function(ctx) {
        ctx.scale(this.scale, this.scale);
        ctx.translate(this.offset[0], this.offset[1]);
    };

    DragAndScale.prototype.convertOffsetToCanvas = function(pos) {
        //return [pos[0] / this.scale - this.offset[0], pos[1] / this.scale - this.offset[1]];
        return [
            (pos[0] + this.offset[0]) * this.scale,
            (pos[1] + this.offset[1]) * this.scale
        ];
    };

    DragAndScale.prototype.convertCanvasToOffset = function(pos, out) {
        out = out || [0, 0];
        out[0] = pos[0] / this.scale - this.offset[0];
        out[1] = pos[1] / this.scale - this.offset[1];
        return out;
    };

    DragAndScale.prototype.mouseDrag = function(x, y) {
        this.offset[0] += x / this.scale;
        this.offset[1] += y / this.scale;

        if (this.onredraw) this.onredraw(this);
    };

    DragAndScale.prototype.changeScale = function(value, zooming_center) {
        if (value < this.min_scale) value = this.min_scale;
        else if (value > this.max_scale) value = this.max_scale;

        if (value == this.scale) return;

        if (!this.element) return;

        var rect = this.element.getBoundingClientRect();
        if (!rect) return;

        zooming_center = zooming_center || [
            rect.width * 0.5,
            rect.height * 0.5
        ];
        var center = this.convertCanvasToOffset(zooming_center);
        this.scale = value;
        if (Math.abs(this.scale - 1) < 0.01) this.scale = 1;

        var new_center = this.convertCanvasToOffset(zooming_center);
        var delta_offset = [
            new_center[0] - center[0],
            new_center[1] - center[1]
        ];

        this.offset[0] += delta_offset[0];
        this.offset[1] += delta_offset[1];

        if (this.onredraw) this.onredraw(this);
    };

    DragAndScale.prototype.changeDeltaScale = function(value, zooming_center) {
        this.changeScale(this.scale * value, zooming_center);
    };

    DragAndScale.prototype.reset = function() {
        this.scale = 1;
        this.offset[0] = 0;
        this.offset[1] = 0;
    };


})();(_=>{

    /***
     * ███████╗███████╗███╗   ███╗    ██╗    ██╗██╗██████╗  ██████╗ ███████╗████████╗
     * ██╔════╝██╔════╝████╗ ████║    ██║    ██║██║██╔══██╗██╔════╝ ██╔════╝╚══██╔══╝
     * █████╗  ███████╗██╔████╔██║    ██║ █╗ ██║██║██║  ██║██║  ███╗█████╗     ██║   
     * ██╔══╝  ╚════██║██║╚██╔╝██║    ██║███╗██║██║██║  ██║██║   ██║██╔══╝     ██║   
     * ██║     ███████║██║ ╚═╝ ██║    ╚███╔███╔╝██║██████╔╝╚██████╔╝███████╗   ██║   
     * ╚═╝     ╚══════╝╚═╝     ╚═╝     ╚══╝╚══╝ ╚═╝╚═════╝  ╚═════╝ ╚══════╝   ╚═╝   
     */

    "use strict";

    window.FSMWidget = class FSMWidget
    {
        constructor( o )
        {
            this.root = null;
            this.inspector = null;
            this.init(o);
        }

        init( o )
        {
            o = o || {};
            this.root = LiteGUI.createElement(
                "div", 
                o.class, 
                o.content, 
                o.style || { width:"100%", height:"100%"}, 
                o.events || {}
            );

            let area = this.area = new LiteGUI.Area({ className: "fsmarea" });
            this.root.appendChild(area.root);

            this.canvas = document.createElement('canvas');
            this.canvas.width = 600;
            this.canvas.height = 400;
            area.add(this.canvas);

            //guardate la variable
            this._root_insert = this.onRootInsert.bind(this);
            this._root_remove = this.onRootRemove.bind(this);
            this.root.addEventListener("DOMNodeInsertedIntoDocument", this._root_insert );
            this.root.addEventListener("DOMNodeRemovedFromDocument",  this._root_remove );

            if(o.fsm)
            {
                setFSM( fsm );
            }

        }

        //Events---------------------------------------------------------------------------
        bindEvents()
        {
            this._resizefunc = this.resize.bind(this);
            window.addEventListener('resize', this._resizefunc);

            if (!this._ondraw_func)
                this._ondraw_func = this.draw.bind(this);
    
            requestAnimationFrame(this._ondraw_func);
        }

        unbindEvents()
        {
            console.assert(LS);
            window.removeEventListener('resize', this._resizefunc);

            LEvent.unbindAll(LS.GlobalScene, this);
            LEvent.unbindAll(LS, this);
        }

        onRootInsert()
        {
            this.bindEvents();

            if (this.fsmeditor)
                this.fsmeditor.init(this._canvas);  

            this.resize();
        }

        onRootRemove()
        {
            this.unbindEvents();

            if (this.fsmeditor)
                this.fsmeditor.stop();  
        }

        onComponentRemoved()
        {
            //Todo            
        }

        onResize()
        {
            this.resize();
        }

        //Functions------------------------------------------------------------------------
        draw()
        {
            //TODO: check that tab is visible
            if (!this.canvas) 
            return;
    
            if (this.root.parentNode)
            requestAnimationFrame(this._ondraw_func);
      
            if (this.fsmeditor)
                this.fsmeditor.draw(this.canvas);
        }

        setFSM( newFSM )
        {
            if (!this.fsmeditor)
                this.fsmeditor = new FSMEditor( this.canvas );
    
            this.fsmeditor.setFSM( newFSM );
        }

        resize()
        {
            var w = this.canvas.parentNode.offsetWidth;
            var h = this.canvas.parentNode.offsetHeight;
            if (!w || !h) return;
        
            if (this.canvas.width != w || this.canvas.height != h) 
            {
                this.canvas.width  = w;
                this.canvas.height = h;
            }
        }
    }
    FSMWidget.widget_name = "FSMGraph";



})();(_=>{

    /***
     * ███████╗███████╗███╗   ███╗    ███╗   ███╗ ██████╗ ██████╗ ██╗   ██╗██╗     ███████╗
     * ██╔════╝██╔════╝████╗ ████║    ████╗ ████║██╔═══██╗██╔══██╗██║   ██║██║     ██╔════╝
     * █████╗  ███████╗██╔████╔██║    ██╔████╔██║██║   ██║██║  ██║██║   ██║██║     █████╗  
     * ██╔══╝  ╚════██║██║╚██╔╝██║    ██║╚██╔╝██║██║   ██║██║  ██║██║   ██║██║     ██╔══╝  
     * ██║     ███████║██║ ╚═╝ ██║    ██║ ╚═╝ ██║╚██████╔╝██████╔╝╚██████╔╝███████╗███████╗
     * ╚═╝     ╚══════╝╚═╝     ╚═╝    ╚═╝     ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
     */                                                                                    

    "use strict";
    
    class FSMModule
    {
        constructor()
        {
            this.name = "FSM";
            this.tab_name = "FSM";
            this.bigicon = "imgs/tabicon-graph.png";
        }

        init()
        {
            console.assert(RenderModule);
            console.assert(LiteGUI);
            
            this.createTab();

            RenderModule.canvas_manager.addWidget( this );

            this.createInterface();
        }

        createTab()
        {
            console.assert(LiteGUI);

            LiteGUI.main_tabs.removeTab("FSM");
            this.tab = LiteGUI.main_tabs.addTab(
                this.tab_name,
                {
                    id: "fsmtab",
                    bigicon: this.bigicon,
                    size: "full",
                    module: this,
                    callback: this.openTab.bind(this),
                    callback_leave: this.closeTab.bind(this)
                }
            );
        }

        openTab() 
        {
            console.assert(InterfaceModule);
            console.assert(LiteGUI);

            InterfaceModule.setSidePanelVisibility(true);
            this.tabs_widget.onResize();
            LiteGUI.main_tabs.selectTab( this.tab_name );
        }
    
        closeTab() 
        {
            console.assert(RenderModule);

            RenderModule.appendViewportTo(null);
        }
    
        setFSM( fsm )
        {
            if(!fsm._tab)
            {
                let tab = this.tabs_widget.addWidgetTab( FSMWidget );
                fsm._tab = tab.id;
            }
            
            let tab = this.tabs_widget.tabs.tabs[fsm._tab];
            if(!tab)
            {
                delete fsm._tab;
                this.setFSM( fsm );
                return;
            }

            this.openTab();
            this.tabs_widget.tabs.selectTab( fsm._tab );
            tab.widget.setFSM( fsm );

        } 

        createInterface()
        {
            console.assert(LiteGUI);

            this.root = LiteGUI.main_tabs.root.querySelector("#fsmtab");
            let area = this.area = new LiteGUI.Area({ width: "100%" });
            this.root.appendChild(area.root);
            //area.split("vertical",[null,"50%"],true);

            LiteGUI.bind(
                area, 
                "split_moved", 
                (function (e) 
                {
                    this.tabs_widget.onResize();
                }).bind(this)
            );

            this.tabs_widget = new GenericTabsWidget();
            this.tabs_widget.supported_widgets = [ FSMWidget ];
            //this.tabs_widget.addWidgetTab(FSMWidget);

            LiteGUI.bind(this.tabs_widget, "tab_created", function (e) 
            {
                var tab = e.detail;
                var widget = tab.widget;
                var inspector = widget.top_widgets;

                /*inspector.addButton(null, "3D", {
                    width: 50, callback: function () {
                        //GraphModule.show3DWindow(); //toggle
                    }
                });

                inspector.addButton(null, "Preview", {
                    width: 100, callback: function () {
                        //GraphModule.showPreviewSelection();
                    }
                });

                inspector.addButton(null, "Side", {
                    width: 80, callback: function () {
                        //GraphModule.showSidePanel();
                    }
                });*/
            });

            area.add(this.tabs_widget);

        }


    }

    {
        console.assert(CORE);
        let fsm = new FSMModule();
        CORE.removeModule( fsm );
        CORE.registerModule( fsm );
        
        
        //Register widget or replace existing --------------------------------------------------------------------------
        var i = CORE.getModule("FSM").tabs_widget.supported_widgets.findIndex( v => v.widget_name == FSMWidget.widget_name );
        if (i != -1)  CORE.getModule("FSM").tabs_widget.supported_widgets[i] = FSMWidget;
        else          CORE.getModule("FSM").tabs_widget.supported_widgets.push(FSMWidget);
    }

})();