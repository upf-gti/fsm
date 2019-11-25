(_=>{

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