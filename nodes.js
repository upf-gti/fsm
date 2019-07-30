(function(){
    //NODE TYPES -------------------------------------------------------------------------------------------------------------------
    class defaultNode{
        constructor(o){
            this.configure(o);
        }
    }
    FSM.registerNodeType( "default", defaultNode );
    
    class playAnimation{
        constructor(o){
            this.configure(o);
        }

        onUpdate( dt )
        {
            
        }
    }
    FSM.registerNodeType( "animation/playAnimation", playAnimation );

    class blendTreeAnimation{
        constructor(o){
            this.configure(o);
        }
    }
    FSM.registerNodeType( "animation/playAnimation", blendTreeAnimation );

})();
