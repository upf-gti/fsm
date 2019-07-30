//@fsmWidget
(function(){
    "use strict";

    window.FSMWidget = class FSMWidget
    {
        constructor( o )
        {
            this.root = null;
            this.inspector = null;
            this.init(o);
        }

        init( o = {} )
        {
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
            if (!this._ondraw_func)
                this._ondraw_func = this.draw.bind(this);
    
            requestAnimationFrame(this._ondraw_func);
        }

        unbindEvents()
        {
            console.assert(LS);

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



})();