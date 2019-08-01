(function(){
    //NODE TYPES -------------------------------------------------------------------------------------------------------------------
    class defaultNode{
        constructor(o){
            this.configure(o);
        }
    }
    FSMNode.registerNodeType( "default", defaultNode );
    
    class playAnimation{
        constructor(o){
            this.configure(o);
        }

        onUpdate( dt )
        {
            
        }
    }
    FSMNode.registerNodeType( "animation/playAnimation", playAnimation );

    class blendTreeAnimation{
        constructor(o){
            this.configure(o);
        }
    }
    FSMNode.registerNodeType( "animation/blendTreeAnimation", blendTreeAnimation );

})();
