"use strict";

var Stack = (()=>{
  
  let map = new WeakMap();
  let _items = [];
  
  /**
   * Stack implementation for ES6 : https://gist.github.com/anish000kumar/0fd37acc866a9577cf259980500b1bbe
   * @class Stack
   */
  class Stack {
    constructor(...items){
      // let's store our items array inside the weakmap
      map.set(this, []);
      // let's get the items array from map, and store it in _items for easy access elsewhere
      _items = map.get(this);
      
      //if constructor receives any items, it should be stacked up
      if(items.length>0)
      items.forEach(item => _items.push(item) )
      
    }
    
    push(...items){
      //push item to the stack
      items.forEach(item => _items.push(item) )
      return this;
      
    }
    
    pop(count=0){
      //pull out the topmost item (last item) from stack
      if(count===0)
      _items.pop()
      else
      _items.splice( -count, count )
      return this
    }
    
    peek(){
      // see what's the last item in stack
      return _items[_items.length-1]
    }
    
    size(){
      //no. of items in stack
      return _items.length
    }
    
    isEmpty(){
      // return whether the stack is empty or not
      return _items.length==0
    }
    
    toArray(){
      // return items of the queue
      return _items
    }

    //Iterable does not work
    [Symbol.iterator]()
    {
      let step = 0;
      const iterator = {
        next()
        {
          ++step;
          return (step >= _items.length)? { value: _items[step], done: false } : { value: undefined, done: true };
        }
      }
      return iterator;
    }
  }
  
  
  return Stack;
  
})();

console.assert	= function(cond, text, dontThrow){
  if ( cond ) return;
  if ( dontThrow ) {
    debugger;
  } else {
    throw new Error(text || "Assertion failed!");
  }
};

function Enum(...items)
{
  let v = {};
  for(var i in items)
  {
    v[items[i]] = parseInt(i);  
  }
  return v;
}

function capitalize(s)
{
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}