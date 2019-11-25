(_=>{

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


})();