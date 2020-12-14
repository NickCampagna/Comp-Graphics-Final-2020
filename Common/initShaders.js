//
//  initShaders.js
//



// This function checks incoming values to determine whether they are
// ints or floats before performing the necessary concatination to convert
// them to the proper string values represented as floats.
// This awkward crap was necessary because every other solution
// caused this program to break, because javascript can't resist
// making a clearly-defined float into an int even when using
// parseFloat().
function toFloatString(val) {
  if (val % 1 == 0) {
    val = val + ".0";
  } else {
    val = val + "0";
  }
  return val
}


function initShaders( gl, red, green, blue, size )
{
    var vertShdr;
    var fragShdr;

    red = toFloatString(red);
    green = toFloatString(green);
    blue = toFloatString(blue);
    size = toFloatString(size);

    var vertexShaderString = "attribute vec4 vPosition;" +
        "void main() {" +
        "gl_PointSize = "+ size +";" +
        "gl_Position = vPosition;" +
        "}";

    var fragmentShaderString = "precision mediump float;" +
        "void main() {" +
        "gl_FragColor = vec4( "+ red +", "+ green +", "+ blue +", 1.0 );" +
        "}";

    /*var vertElem = document.getElementById( vertexShaderId );
    if ( !vertElem ) {
        alert( "Unable to load vertex shader " + vertexShaderId );
        return -1;
    }
    else {*/
        vertShdr = gl.createShader( gl.VERTEX_SHADER );
        gl.shaderSource( vertShdr, vertexShaderString );
        gl.compileShader( vertShdr );
        if ( !gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS) ) {
            var msg = "Vertex shader failed to compile.  The error log is:"
        	+ "<pre>" + gl.getShaderInfoLog( vertShdr ) + "</pre>";
            alert( msg );
            return -1;
        }
    //}

    /*var fragElem = document.getElementById( fragmentShaderId );
    if ( !fragElem ) {
        alert( "Unable to load vertex shader " + fragmentShaderId );
        return -1;
    }
    else {*/
        fragShdr = gl.createShader( gl.FRAGMENT_SHADER );
        gl.shaderSource( fragShdr, fragmentShaderString );
        gl.compileShader( fragShdr );
        if ( !gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS) ) {
            var msg = "Fragment shader failed to compile.  The error log is:"
        	+ "<pre>" + gl.getShaderInfoLog( fragShdr ) + "</pre>";
            alert( msg );
            return -1;
        }
    //}

    var program = gl.createProgram();
    gl.attachShader( program, vertShdr );
    gl.attachShader( program, fragShdr );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {
        var msg = "Shader program failed to link.  The error log is:"
            + "<pre>" + gl.getProgramInfoLog( program ) + "</pre>";
        alert( msg );
        return -1;
    }

    return program;
}
