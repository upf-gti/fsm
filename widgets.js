(function(){
        
    //NODE WIDGETS -------------------------------------------------------------------------------------------------------------------
    class progressBar
    {
        constructor(o)
        {
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

})();