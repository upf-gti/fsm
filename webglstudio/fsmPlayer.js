window.DEBUG = true;

(function(){
    class FSMPlayer
    {
        constructor( o )
        {
            this.fsm_filename = null;
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
                var that = this;
                LS.ResourcesManager.load(this.fsm_filename, function(res) {
                    console.assert( res, `Resource is empty`, window.DEBUG);
                    that._res = res;
                    res.onStart();
                });    
            }
            
        }

        onUpdate(dt){
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
                    });  
                }
                else
                    CORE.getModule("FSM").setFSM( component._res );
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

            inspector.addSeparator();

            inspector.addTitle("Global BlackBoard");
            inspector.widgets_per_row = 2;
            for(let key in component._res.constructor.vars)
            {
                let value = component._res.constructor.vars[key];
                component._res.constructor._widgets = component._res.constructor._widgets || {};
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
                let name = inspector.addString( "New value", `_var_${Object.keys(component._res.constructor.vars).length}`, { width:"72%" } );
                
                var types = (["boolean","number","string", "vec2", "vec3", "vec4"]).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );//Object.values(LS.TYPES).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );
                component._res.constructor._createvartype = inspector.addCombo(null, (component._res.constructor._createvartype)?component._res.constructor._createvartype.getValue() : "number", 
                { width:"28%",values: types, callback: function(v) {  inspector.refresh(); } });
                    
                inspector.widgets_per_row = 3;
                switch(component._res.constructor._createvartype.getValue())
                {
                    case("boolean"): types.setValue("checkbox"); break;
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
                    delete component._res.constructor._createvar; delete component._res.constructor._createvartype; inspector.refresh(); } 
                });
                
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABZUlEQVR4Ae2agWYDQRRFBxCxHxEAFsY8CwsW+r9pAdWgAvmdCttVmJJiIEzFO55wz/zAOWRj5s0kIYQQQgghhBBC/I9xsPc8JYA8lY9xSCy2t4vVcs0ToH+1ahfbs/pnq1Z9E5r+bZ2xhMPuT78lAPq3hMMO0S8nq1a9E5p+W+UEJNjRalstwVW/rWPyJi9l80/I8z39suUlNfCE+XF9W7v6fIKtecb1+QRcn0/A9fkEXJ9PwPXjE/JyT99WQB8Q6Yc7AH6IqD6fgOrzCag+n4Dq8wmYPp/gsAmMTsgvDtvwyAT7idR3OJzw+sxsgdfnE3h9PoHS5xMA/fgA+6IC9BMCPmL9jQL6fAKgXzb7jkxwmHF2ZqraTutAwx8pdaiPH6tosBU/WtRwN368rguO2CsmXfLFX7Pqott3xhmQUN589TsJr8/03GbuP7fRg6foJ2d69NcYh/IZ/+xSCCGEEEIIIYQQvw2UKo1mqKrvAAAAAElFTkSuQmCC"/>', 
                { width:"30px", callback: function(v) { delete component._res.constructor._createvar; delete component._res.constructor._createvartype; inspector.refresh() } });
                
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
                for(let key in component._res.vars)
                {
                    let value = component._res.vars[key];
                    component._res._widgets = component._res._widgets || {};
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
                    let name = inspector.addString( "New value", `_var_${Object.keys(component._res.vars).length}`, { width:"72%", callback: function(v) {  } } );
                    
                    var types = (["boolean","number","string", "vec2", "vec3", "vec4"]).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );;//Object.values(LS.TYPES).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );
                    component._res._createvartype = inspector.addCombo(null, (component._res._createvartype)?component._res._createvartype.getValue() : "number", 
                    { width:"28%",values: types, callback: function(v) {  inspector.refresh(); } });
                        
                    inspector.widgets_per_row = 3;
                    switch(component._res._createvartype.getValue())
                    {
                        case("boolean"): types.setValue("checkbox"); break;
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
                    
                    inspector.addSeparator();
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
                        debugger;
                        inspector.refresh();
                    }
                }

                if(!component._res.constructor.onGlobalChanged)
                {
                    component._res.onGlobalChanged = (property, value) => {
                        debugger;
                        inspector.refresh();
                    }
                }

            /*
            if(!LS) 
                    return;
                component._inspector = inspector;

                inspector.widgets_per_row = 4;
                inspector.addResource("Resource File", component.resource, { width:"calc(100% - 90px)", callback: v => component.resource = v  }, "FSMData");
                
                //Reload
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAADwklEQVR4Ae2aY5jGVhCFZ+3a9iK7+XLPqW23v2rbtm3btm3btm3bbWpN8i0nt83z3Hd+Z+ac6GokEAgEAoFAIBAIBKyIGjkr1sJBuIoP8zV8w6/4Oh/GVTgIayWzRI0yJLiT+COZGjvzZnzLtJ/4Grdg+3gcGRTchqn4oG90bsvHmQ46vsPZycyDke/BgJsUR/IrpkMP3M0lpVaqgE2YFm+ghusNUbyOp9081eQXbqAyIW5hahBXurGz8gs3wOX4KVOjeBuUv+C6TIs2UMfjmVoGvnXLKPnFGWArru9Xzgs8kxu5mX7/53d2xJ2cCytwW57Jl/qx8BO3VfKLMTBVE++tfh9xUtwp/cA+nMbvq15/A9PCDfC8KsW/4IG948og6J0Yh/Pr/CyFG3Bb55b5EvtGY8gQiCfitfRvAAvgp5wiz7hJh/cfw8deDVSmwefZArg8bpNhEo2HW/wZqMGjOQWOkloZAWzgeZ4MuNVz0p9gcFtO8mIgauf72SmA1MoIUfKLM4Dts59u1C4jhEd5+oijdn6iPt1v2GUl34MBbKrTYhdD+R4MPKLSvj5Vk5V8DwZcTybt5jIicDBTjwawh3p9Pu/sMJTvwcD9evCyk+/BQDKanv9UnJ18DwawmEr5gQwb7s3Uv4Gt1BdwgaV8DwZ4gkq5haV8DwZw678TuoWkXOAp9QpNJeWCr6uHOpaUC719NVGLlAu9bo0aS/4KdY0p5YJPl/wjxm3/NpAsLOUCJ6onsKWUC26jfqPnSblwi2cmc+UiatfTaVeRcoH71FdwpBQETlNP+3YRD0tKK9wE/L6QH0Yl0lNct5kUAA7SdfqmEBvwqPW2Su5O9Reqyh1iBTbR9wY7izE8S9dwq4sVE7XoKR2+iTvFkGTm7NGr6bQR25lu7iriNj6Tyb+u9Wjwni6Bq6RWLKjLObZ90Xza7lYzO+BQ8JRsZjePmFPDh+2PmKQWh+RkvViKIO7MO+TjFXHbCHb9bszJ+KlqiLLDLWR5zOqmxStMs+GWEU3RB934AvtyrCH+mPfDj7m5DpJiwTnVWw04/uDEc2V179WfrVCmasL9w232YEMyH07ml0yryWeDGGDSboMZf/+TT9bM8dGdzMKNeIWSruM8qRdP1OmVskEcJTXiEyzFT8zEf+1WE//0TmzU9PdgMrX8R9Rg/RG2Xb7lVjN6dfw3vvJTt4PBVrFZ6/FjQxL/KrY32GX11PytpR+ZzCe1/+P2+2SWP9rvH/qt/f73lsoXcSF3xGLxRGJEIBAIBAKBQCAQCPwM9/tgs3UybYkAAAAASUVORK5CYII="/>',{ width:"30px",callback: _ => component.configure() });
                
                //Save
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABz0lEQVR4Ae3bMSyDQRjG8ZcEImVfYPiikk/wvc8+IhH7JGZ2dptYYCTsE4g97BN7QgQjabqY2rP3Uv2uKn3f5Pnf3twvuaR3X+6EtY8xxhhjbH5Sd/UBNYT/HbonvS+v4Fqb6ZMxQshG9ClhAvYIeoaA4JagmTYQHBOwj4DgmKCPCK4J+EZwTWj9Selx6QT7gJjgGxAT3AFigjtATHAHiAnuADHBHSAmuAMg9AFAAAEEEECAoUEAAQQQQAABBBBAAAEEuAF84nxpDXN5pTq+UNV1nOuXH8BrsYUhaSkfLrbw5gFwMzMqbZoZ1UvrgBPpkB4ZBuidDEinBvTWKEDfMSYlwpi+mwQUm1KyYtMgQF9kUMo2iGd7gCNJSI/tAVYlIayYAyzOSkKLs+YA2YQklE2YA+SVxMtsXEI9BmBFElpaNgfQQ0lIDy3+kSWEZ4t7oQ0pmW5438x9WN1O35baTt/5PtAcuz5S4sbFoR7bGIpvYmMbb44+q+iFrmOuOt6/zyp1BEOj7urqcTz0KR1wYApwIKkV09owM/0GpiQ9PTUDOOv2CcqjjfWfjXT9CEivtNnXyTf1Kq/IX8IUdnr3DCth1HCPnd/WPmOMMcYY+wEnjmA6v/+P6wAAAABJRU5ErkJggg=="/>',  { width: "30px", callback: _ => 
                { 
                    component.serialize(); 
                }});
                
                //Download
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABoklEQVR4Ae3ZgYYCURTG8RtoJCIA2h0ETLDnvFoAkoUNCMgu9AYBsBASBNL2HkEAbHdDPnbdoTnWnJHvO8BN+v8AFDiO4ziO47j/n8bfRwABBBBAAAEEEEAAAQQQQAABBBBAAAEEEPBQgJZOir4FUPR1ElrBe7LUqEftVQVoT48aZRl8p4tb4F579wGQv799sgh+k7lG3L7o3gsousi/nsyd83E7EEoAyN/h3Y+gbxpxIGinDJDOx73WDpCpxsRtb4QSgHaS+VGmITSKkAZc87e15CcDKhDyLPX9PCvLN/y+BXA/QdZ59vctz2Rdnu8FKCd8pl/S+a4AEAyHfE+AnYB8T4CdgHx/AAj2fH8ACPZ8fwAI9nxvAAj2fG8ACPZ8bwAI9nxvAAj2fGcACPZ8XwAI9nx/AAjI9wdYCcj3BtgIyPcH1DgCCCCAAAIIIOCssUF3rgyQQ5MA8lUZoLMmAXRWGfDyLN9Nyb+WPIXqk/fGAD6CZcO2HBqRfxi2g21FV1ZycY2/yAr/fdo2GuhYNnqqPf4kGx2PBoHjOI7jOI4r3Q+c8wi2Mf/1OgAAAABJRU5ErkJggg=="/>', { width:"30px", callback: j => 
                {

                    if(!component.resource) return;
                    LS.ResourcesManager.load( component.resource, function(res) {
                        res.data;
                        var pom = document.createElement('a');
                        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data)));
                        pom.setAttribute('download', component.resource.substr(component.resource.lastIndexOf("/")+1));
                        if (document.createEvent) {
                            var event = document.createEvent('MouseEvents');
                            event.initEvent('click', true, true);
                            pom.dispatchEvent(event);
                        }
                        else {
                            pom.click();
                        }
                    });
                } });
                
                inspector.widgets_per_row = 3;

                inspector.addNumber("Vars",         parseInt( Object.keys( component.vars        ).length ).toString(), { disabled: true });
                inspector.addNumber("Nodes",        parseInt( Object.keys( component.states      ).length ).toString(), { disabled: true });
                inspector.addNumber("Transitions",  parseInt( Object.keys( component.transitions ).length ).toString(), { disabled: true });

                inspector.widgets_per_row = 1;
                inspector.addButton(null, "Edit FSM",  { callback: _ => CORE.getModule("FSM").setFSM( component ) });
                
                inspector.addSeparator();
                inspector.addTitle("Global BlackBoard");
                inspector.widgets_per_row = 2;
                for(let key in component.constructor.vars)
                {
                    let value = component.constructor.vars[key];
                    component.constructor._widgets = component.constructor._widgets || {};
                    switch( value.constructor.name )
                    {
                        case "Number": component.constructor._widgets[key] = inspector.addNumber(key, value,   { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component.constructor, "globalvars/" + key), callback: (v) => { component.constructor.vars[key] = v; } }); break;
                        case "String":  component.constructor._widgets[key] = inspector.addString(key, value,  { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component.constructor, "globalvars/" + key), callback: (v) => { component.constructor.vars[key] = v; } }); break;
                        case "Boolean": component.constructor._widgets[key] = inspector.addCheckbox(key, value,{ width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component.constructor, "globalvars/" + key), callback: (v) => { component.constructor.vars[key] = v; } }); break;
                        case "Float32Array": {
                            switch (value.length) {
                                case 2: component.constructor._widgets[key] = inspector.addVector2(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component.constructor, "globalvars/" + key), callback: (v) => { component.constructor.vars[key] = v; } }); break;
                                case 3: component.constructor._widgets[key] = inspector.addVector3(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component.constructor, "globalvars/" + key), callback: (v) => { component.constructor.vars[key] = v; } }); break;
                                case 4: component.constructor._widgets[key] = inspector.addVector4(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component.constructor, "globalvars/" + key), callback: (v) => { component.constructor.vars[key] = v; } }); break;
                                default:component.constructor._widgets[key] = inspector.addList(key, value,    { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component.constructor, "globalvars/" + key) });
                            }
                            break;
                        }
                        default: component.constructor._widgets[key] = inspector.addString("!" + key, value.toString(),{ width:"calc(100% - 30px)"});
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
                            delete component.constructor._widgets[key];
                            delete component.constructor.vars[key];
                            inspector.refresh();
                        });
                        widgets.addButton(null, "Cancel", _=> dialog.close());
                        
                        dialog.show();

                    }} );
                }

                if(component.constructor._createvar)
                {
                    
                    inspector.widgets_per_row = 2;
                    inspector.addSeparator();
                    let name = inspector.addString( "New value", `_var_${Object.keys(component.constructor.vars).length}`, { width:"72%" } );
                    
                    var types = (["boolean","number","string", "vec2", "vec3", "vec4"]).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );//Object.values(LS.TYPES).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );
                    component.constructor._createvartype = inspector.addCombo(null, (component.constructor._createvartype)?component.constructor._createvartype.getValue() : "number", 
                    { width:"28%",values: types, callback: function(v) {  inspector.refresh(); } });
                        
                    inspector.widgets_per_row = 3;
                    switch(component.constructor._createvartype.getValue())
                    {
                        case("boolean"): types.setValue("checkbox"); break;
                    }
                        
                    let value = inspector.add(component.constructor._createvartype.getValue(), null , null, {width:"calc(100% - 60px)"});
                    switch(component.constructor._createvartype.getValue())
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
                        component.constructor.vars[name.getValue()] = value.getValue();
                        delete component.constructor._createvar; delete component.constructor._createvartype; inspector.refresh(); } 
                    });
                    
                    inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABZUlEQVR4Ae2agWYDQRRFBxCxHxEAFsY8CwsW+r9pAdWgAvmdCttVmJJiIEzFO55wz/zAOWRj5s0kIYQQQgghhBBC/I9xsPc8JYA8lY9xSCy2t4vVcs0ToH+1ahfbs/pnq1Z9E5r+bZ2xhMPuT78lAPq3hMMO0S8nq1a9E5p+W+UEJNjRalstwVW/rWPyJi9l80/I8z39suUlNfCE+XF9W7v6fIKtecb1+QRcn0/A9fkEXJ9PwPXjE/JyT99WQB8Q6Yc7AH6IqD6fgOrzCag+n4Dq8wmYPp/gsAmMTsgvDtvwyAT7idR3OJzw+sxsgdfnE3h9PoHS5xMA/fgA+6IC9BMCPmL9jQL6fAKgXzb7jkxwmHF2ZqraTutAwx8pdaiPH6tosBU/WtRwN368rguO2CsmXfLFX7Pqott3xhmQUN589TsJr8/03GbuP7fRg6foJ2d69NcYh/IZ/+xSCCGEEEIIIYQQvw2UKo1mqKrvAAAAAElFTkSuQmCC"/>', 
                    { width:"30px", callback: function(v) { delete component.constructor._createvar; delete component.constructor._createvartype; inspector.refresh() } });
                    
                    inspector.addSeparator();
                }


                inspector.widgets_per_row = 1;
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAAB9JREFUeAFjgIJRwP+BZM4oh/8/GHygIYd8h45yRgEAaHBnmaA4EHkAAAAASUVORK5CYII="/>', 
                { width:"30px", callback: j => { 
                    component.constructor._createvar = true;
                    inspector.refresh()
                }});

                inspector.widgets_per_row = 1;
                inspector.addTitle("Component BlackBoard");
                inspector.widgets_per_row = 2;
                for(let key in component.vars)
                {
                    let value = component.vars[key];
                    component._widgets = component._widgets || {};
                    switch( value.constructor.name )
                    {
                        case "Number":  component._widgets[key] = inspector.addNumber(key, value,  { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component, "vars/" + key), callback: (v) => { component.vars[key] = v; } }); break;
                        case "String":  component._widgets[key] = inspector.addString(key, value,  { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component, "vars/" + key), callback: (v) => { component.vars[key] = v; } }); break;
                        case "Boolean": component._widgets[key] = inspector.addCheckbox(key, value,{ width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component, "vars/" + key), callback: (v) => { component.vars[key] = v; } }); break;
                        case "Float32Array": {
                            switch (value.length) {
                                case 2: component._widgets[key] = inspector.addVector2(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component, "vars/" + key), callback: (v) => { component.vars[key] = v; } }); break;
                                case 3: component._widgets[key] = inspector.addVector3(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component, "vars/" + key), callback: (v) => { component.vars[key] = v; } }); break;
                                case 4: component._widgets[key] = inspector.addVector4(key, value, { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component, "vars/" + key), callback: (v) => { component.vars[key] = v; } }); break;
                                default:component._widgets[key] = inspector.addList(key, value,    { width:"calc(100% - 30px)", pretitle: AnimationModule.getKeyframeCode(component, "vars/" + key) });
                            }
                            break;
                        }
                        default: component._widgets[key] = inspector.addString("!" + key, value.toString(), { width:"calc(100% - 30px)"});
                    }

        
                    inspector.addButton(null, '<img style="width:100%; filter: contrast(4);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjUxRDQxMDYwNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjUxRDQxMDYxNUJDQTExRTVBOEM0RUE2MzcyNzE5MjVBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTFENDEwNUU1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTFENDEwNUY1QkNBMTFFNUE4QzRFQTYzNzI3MTkyNUEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7KsC9jAAAABlBMVEX///////9VfPVsAAAAAnRSTlP/AOW3MEoAAAAsSURBVHjaYmBEAQxQigHOZYADuCyyYgYwhDKpzEWyhBHmECRHorkZBgACDAA92gCZG0I57gAAAABJRU5ErkJggg=="/>', 
                    { width:"30px", callback: j => { 
                        delete component._widgets[key];
                        delete component.vars[key];
                        inspector.refresh();
                    }} );

                }

                if(component._createvar)
                {
                    
                    inspector.widgets_per_row = 2;
                    inspector.addSeparator();
                    let name = inspector.addString( "New value", `_var_${Object.keys(component.vars).length}`, { width:"72%", callback: function(v) {  } } );
                    
                    var types = (["boolean","number","string", "vec2", "vec3", "vec4"]).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );;//Object.values(LS.TYPES).filter( v => Object.keys(LiteGUI.Inspector.widget_constructors).includes(v) );
                    component._createvartype = inspector.addCombo(null, (component._createvartype)?component._createvartype.getValue() : "number", 
                    { width:"28%",values: types, callback: function(v) {  inspector.refresh(); } });
                        
                    inspector.widgets_per_row = 3;
                    switch(component._createvartype.getValue())
                    {
                        case("boolean"): types.setValue("checkbox"); break;
                    }
                        
                    let value = inspector.add(component._createvartype.getValue(), null , null, {width:"calc(100% - 60px)"});
                    switch(component._createvartype.getValue())
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
                        component.vars[name.getValue()] = value.getValue();
                        delete component._createvar; delete component._createvartype; inspector.refresh(); } 
                    });
                    
                    inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAABZUlEQVR4Ae2agWYDQRRFBxCxHxEAFsY8CwsW+r9pAdWgAvmdCttVmJJiIEzFO55wz/zAOWRj5s0kIYQQQgghhBBC/I9xsPc8JYA8lY9xSCy2t4vVcs0ToH+1ahfbs/pnq1Z9E5r+bZ2xhMPuT78lAPq3hMMO0S8nq1a9E5p+W+UEJNjRalstwVW/rWPyJi9l80/I8z39suUlNfCE+XF9W7v6fIKtecb1+QRcn0/A9fkEXJ9PwPXjE/JyT99WQB8Q6Yc7AH6IqD6fgOrzCag+n4Dq8wmYPp/gsAmMTsgvDtvwyAT7idR3OJzw+sxsgdfnE3h9PoHS5xMA/fgA+6IC9BMCPmL9jQL6fAKgXzb7jkxwmHF2ZqraTutAwx8pdaiPH6tosBU/WtRwN368rguO2CsmXfLFX7Pqott3xhmQUN589TsJr8/03GbuP7fRg6foJ2d69NcYh/IZ/+xSCCGEEEIIIYQQvw2UKo1mqKrvAAAAAElFTkSuQmCC"/>', 
                    { width:"30px", callback: function(v) { delete component._createvar; delete component._createvartype; inspector.refresh() } });
                    
                    inspector.addSeparator();
                }


                inspector.widgets_per_row = 1;
                inspector.addButton(null, '<img style="width:100%; filter: contrast(4) invert(1);"src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgAQMAAADYVuV7AAAABlBMVEUAAAAzMzPI8eYgAAAAAXRSTlMAQObYZgAAAB9JREFUeAFjgIJRwP+BZM4oh/8/GHygIYd8h45yRgEAaHBnmaA4EHkAAAAASUVORK5CYII="/>', 
                { width:"30px", callback: j => { 
                    component._createvar = true;
                    inspector.refresh()
                }});
            */
        }
    }
    FSMPlayer["@fsm_filename"] = { widget: "resource", resource_classname:"FSM" };

    
    

    if(LS.Components["FSMPlayer"])
        LS.unregisterComponent("FSMPlayer");
    LS.registerComponent( FSMPlayer );

})();