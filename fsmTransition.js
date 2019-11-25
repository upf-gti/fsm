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

})();