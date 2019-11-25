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


