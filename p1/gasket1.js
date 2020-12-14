"use strict";

class Shape {
  constructor(id, shapeType, verts, red, green, blue) {
    this.id = id;
    this.shapeType = shapeType;
    this.verts = verts;
    this.r = red;
    this.g = green;
    this.b = blue;
  }
}

// several vars have been made global for ease of use
// by both init() and prepRender()
var gl;
var canvas;
var ctx;
var circCanvas;
var vertices;
var shapes;
var identity;
var shapeMenu = document.getElementById("shapeMenu");
var transformMenu = document.getElementById("transformMenu");
var shapeCount = 0;
var dX;
var dY;

// drawMode - determines canvas drawing drawMode
// 0 = off
// 1 = limited clicks - for drawing rectangle, triangle, line, square, etc...
// 2 = unlimited clicks until right click - for polygon & polyline
var drawMode = 0;
var remainingClicks = 0; // will be set by the shape, for drawMode 1
var clickCoords = [];
var drawingShape;

function setVertices() {
  switch (shapeMenu.selectedIndex) {
    case 0: // line
        vertices = [
          vec2( 0, 0),
          vec2(  50, 100)
        ];
        break;
    case 1: // poly-line
        vertices = [
          vec2( 0, 0),
          vec2(  50, 100),
          vec2(  150, 25),
          vec2(  472, 120),
          vec2(  45, 250)
        ];
        break;
    case 2: // square
        vertices = [
          vec2( 0, 0),
          vec2( 100, 0),
          vec2(  100, 100),
          vec2(  0, 100)
        ];
        break;
    case 3: // rectangle
        vertices = [
          vec2( 0, 0),
          vec2( 200, 0),
          vec2(  200, 100),
          vec2(  0, 100)
        ];
        break;
    case 4: // triangle
        vertices = [
          vec2( 0, 0),
          vec2(  50, 100),
          vec2(  100, 0)
        ];
        break;
    case 5: //polygon
        vertices = [
          vec2( 0, 0),
          vec2(  150, 100),
          vec2(  300, 50),
          vec2(  150, 0)
        ];
        break;
    case 6:// circle
        vertices = [
            vec2( 256, 256),
            vec2(  400, 256)
          ];
        break;
    case 7:// ellipse
        vertices = [
            vec2( 256, 256),
            vec2(  400, 256)
          ];
        break;
    case 8:// curve
        vertices = [
            vec2( 256, 256),
            vec2(  400, 256)
          ];
        break;
    }
};

function setIdentity() { // https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html
  switch (transformMenu.selectedIndex) {
    case 0: // translate
        let tx = dX;
        let ty = dY;
        identity =
        [ 1.0, 0.0, 0.0,
          0.0, 1.0, 0.0,
          tx, ty, 1.0];
        break;
    case 1:// scale
        identity =
        [ dX, 0.0, 0.0,
          0.0, dY, 0.0,
          0.0, 0.0, 1.0];
        break;
    case 2: // rotate
      let sin = Math.sin(dX);
      let cos = Math.cos(dX);
      identity =
      [ cos, -sin, 0.0,
        sin, cos, 0.0,
        0.0, 0.0, 1.0];
        break;
    }
};

function applyMatrixMultiplication() { // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
    var multiVerts = [];
    var finalVerts = [];
    //console.log(identity);

    for (let i = 0; i < vertices.length; i++){
      let x = vertices[i][0];
      let y = vertices[i][1];
      let z = 1;

      let resultX = (x * identity[0]) + (y * identity[3]) + (z * identity[6]);
      let resultY = (x * identity[1]) + (y * identity[4]) + (z * identity[7]);
      let resultZ = (x * identity[2]) + (y * identity[5]) + (z * identity[8]);

      multiVerts.push(vec2(resultX, resultY));
    }

    //console.log(multiVerts);
    vertices = multiVerts;
};

function getFieldValue(index) {
    var fieldVal = document.getElementById("form").elements[index].value;
    let min;
    let def; //default value
    let max;

    switch(index) {
      case 0: // form slot 1 - "shape ID"
        min = 0;
        def = 0;
        max = shapeCount-1;
        break;
      case 1: //dX
      case 2: //dY
        switch(transformMenu.selectedIndex) {
          case 0: // Translate
            min = -5000;
            def = 10;
            max = 5000;
            break;
          case 1: // Scale
            min = -10;
            def = 0.5;
            max = 10;
            break;
          case 2: // Rotate
            min = -5000;
            def = 50;
            max = 5000;
            break;
        }
        break;
      case 3: // RED
      case 4: // GREEN
      case 5: // BLUE
        min = 0;
        def = 0;
        max = 255;
        break;
    }

    if(isNaN(fieldVal) || fieldVal == "") {
      return def;
    } else if (fieldVal < min) {
      return min;
    } else if (fieldVal > max) {
      return max;
    } else {
      if (index == 1 || index == 2) {
        return (parseFloat(fieldVal));
      }
      return (parseInt(fieldVal));
    }
};

window.onload = function init()
{
    document.getElementById("status").innerHTML = "Status: JavaScript Loaded. Initializing canvas.";
    circCanvas = document.getElementById( "circ-canvas" );
    ctx = circCanvas.getContext('2d');

    ctx.fillStyle = "white";
    ctx.fillRect(0,0,512,512);

    vertices = [];
    shapes = [];

    document.getElementById("status").innerHTML = "Status: Awaiting Input.";

    // DISPLAY BUTTON FUNCTION ----------------------------------------
    if (drawMode != 0) {
      document.getElementById("status").innerHTML = "Status: DENIED - Canvas Drawing is currently active! Finish drawing your shape or cancel with the Cancel button first!";
      return;
    }
    document.getElementById("DisplayButton").onclick = function() {
      if (shapeMenu.selectedIndex == -1) {
        document.getElementById("status").innerHTML = "Status: You must choose a shape.";
        return;
      }

      let r = getFieldValue(3);
      let g = getFieldValue(4);
      let b = getFieldValue(5);

      document.getElementById("status").innerHTML = "Status: Generating Vertices.";
      setVertices();
      document.getElementById("status").innerHTML = "Status: Rendering.";

      let newShape = new Shape(shapeCount, shapeMenu.selectedIndex, vertices, r, g, b);
      shapes.push(newShape);
      shapeCount++;
      console.log(shapes);

      render();
    };

    // TRANSFORM BUTTON FUNCTION ----------------------------------------
    document.getElementById("TransformButton").onclick = function() {
      if (drawMode != 0) {
        document.getElementById("status").innerHTML = "Status: DENIED - Canvas Drawing is currently active! Finish drawing your shape or cancel with the Cancel button first!";
        return;
      }
      if (shapes.length == 0) {
        document.getElementById("status").innerHTML = "Status: No shapes were created yet. Please make at least one first.";
        return;
      }
      if (transformMenu.selectedIndex == -1) {
        document.getElementById("status").innerHTML = "Status: You must choose a transformation.";
        return;
      }

      let selectedShape = getFieldValue(0);
      dX = getFieldValue(1);
      dY = getFieldValue(2);
      let r = shapes[selectedShape].r;
      let g = shapes[selectedShape].g;
      let b = shapes[selectedShape].b;

      circCanvas = document.getElementById( "circ-canvas" );
      ctx = circCanvas.getContext('2d');
      document.getElementById("status").innerHTML = "Status: Generating Vertices.";
      //setVertices();
      vertices = shapes[selectedShape].verts;
      console.log(vertices);
      setIdentity();
      applyMatrixMultiplication();
      document.getElementById("status").innerHTML = "Status: Rendering.";

      let newShape = new Shape(selectedShape, shapes[selectedShape].shapeType, vertices, r, g, b);
      shapes[selectedShape] = newShape;

      render();
    };

    // CLEAR BUTTON FUNCTION -----------------------------------------
    document.getElementById("ClearButton").onclick = function() {
      if (drawMode != 0) {
        document.getElementById("status").innerHTML = "Status: DENIED - Canvas Drawing is currently active! Finish drawing your shape or cancel with the Cancel button first!";
        return;
      }
      //ctx.clearRect(0, 0, 512, 512);
      // replaced clearRect with a white fillRect so when an image is downloaded, the background is white instead of black
      ctx.fillStyle = "white";
      ctx.fillRect(0,0,512,512);

      shapes = [];
      shapeCount = 0;
      console.log(shapes);
      document.getElementById("status").innerHTML = "Status: Render Cleared. Awaiting Input.";
    };

    // DOWNLOAD BUTTON FUNCTION -----------------------------------------
    document.getElementById("downloadButton").onclick = function() {
      // referenced these and simplified:
      // https://stackoverflow.com/questions/17397319/save-canvas-as-jpg-to-desktop
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
      this.href = circCanvas.toDataURL('image/jpeg');
    };

    // SAVE JSON BUTTON FUNCTION -----------------------------------------
    document.getElementById("SaveJSON").onclick = function() {
      if (shapeCount == 0) {
        document.getElementById("status").innerHTML = "Status: DENIED - There are no shapes to Save to JSON!";
        return;
      }


      let arrayJSON = [];
      let tempObject = {"id":0, "shapeType":0, "vertices":[], "r":0, "g":0, "b":0};

      for (let i=0; i<shapeCount; i++) {
        tempObject["id"] = shapes[i].id;
        tempObject["shapeType"] = shapes[i].shapeType;
        tempObject["vertices"] = shapes[i].vertices;
        tempObject["r"] = shapes[i].r;
        tempObject["g"] = shapes[i].g;
        tempObject["b"] = shapes[i].b;
        arrayJSON.push(tempObject);
      }

      // used as reference for saving a JSON file: https://stackoverflow.com/questions/28464449/how-to-save-json-data-locally-on-the-machine
      let resultJSON = JSON.stringify(arrayJSON);
      var a = document.createElement('a');
      a.setAttribute('href', 'data:text/plain;charset=utf-8,'+encodeURIComponent(resultJSON));
      a.setAttribute('download', 'filename.json');
      a.click();
    };

    // LOAD FROM JSON BUTTON FUNCTION -----------------------------------------
    document.getElementById("LoadJSON").onclick = function() {
      console.log("why");
      // https://codepen.io/KryptoniteDove/post/load-json-file-locally-using-pure-javascript
      var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
      xobj.open('GET', '../my_data.json', false); // Replace 'my_data' with the path to your file
      // Cut out the callback code as it was not required
      xobj.send(null);

      console.log("test...");
      console.log(xobj);
      let testJSON = JSON.parse(xobj.responseText);
      console.log("test 2");
      console.log(testJSON);
  };

    // DRAW ON CANVAS BUTTON FUNCTION ----------------------------------------
    document.getElementById("DrawButton").onclick = function() {
      if (shapeMenu.selectedIndex == -1) {
        document.getElementById("status").innerHTML = "Status: You must choose a shape.";
        return;
      }

      switch (shapeMenu.selectedIndex) {
        case 0: // line
          drawMode = 1;
          remainingClicks = 2;
          break;
        case 1: // poly-Line
          drawMode = 2;
          break;
        case 2: // square
        case 3: // rectangle
          drawMode = 1;
          remainingClicks = 2;
          break;
        case 4: // triangle
          drawMode = 1;
          remainingClicks = 3;
          break;
        case 5: // polygon
          drawMode = 2;
          break;
        case 6:
        case 7:
        case 8:
          drawMode = 1;
          remainingClicks = 2;
          break;
      }
      drawingShape = shapeMenu.selectedIndex;
    }

    // CANCEL BUTTON FUNCTION -------------------------------------------------
    document.getElementById("CancelButton").onclick = function() {
      drawMode = 0;
      remainingClicks = 0;
      clickCoords = [];
    }

    // ON CLICKING CANVAS -----------------------------------------
    // following link was referenced for getting coordinates from clicking on canvas
    // https://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element/18053642#18053642
    function getCursorPosition(canvas, event, wasRightClick) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      console.log("x: " + x + " y: " + y);

      if (!wasRightClick) {
        if (drawMode == 0) {
          document.getElementById("status").innerHTML = "Status: Shape Drawning must be enabled to draw via clicking on canvas.";
          return;
        }

        document.getElementById("status").innerHTML = "Status: Click registered at point (" + x + "," + y + ").";
        clickCoords.push(vec2(x, y));

        if (drawMode == 1) {
          remainingClicks--;
          if (remainingClicks < 1) {
            drawMode = 0;
            remainingClicks = 0;
            finalizeShape();
          }
        }
      } else {
        if (drawMode != 2) {
          document.getElementById("status").innerHTML = "Status: Right-clicking on canvas is only used for drawing POLYGON and POLY-LINE shapes!";
          return;
        }

        clickCoords.push(vec2(x, y));
        drawMode = 0;
        finalizeShape();
      }
    }

    // Event Listener for Canvas-Clicking -------------------------------------
    const canvas = document.querySelector('#circ-canvas');
    canvas.addEventListener('click', function(e) {
      getCursorPosition(canvas, e, false);
    })
    canvas.addEventListener('contextmenu', function(e) {
      getCursorPosition(canvas, e, true);
    })
};

function finalizeShape() {
  console.log("click coords: " + clickCoords);
  vertices = [];
  if (drawingShape == 3) { // makes a rectangle out of the two coordinates provided
    vertices.push(vec2(clickCoords[0][0], clickCoords[0][1]));
    vertices.push(vec2(clickCoords[1][0], clickCoords[0][1]));
    vertices.push(vec2(clickCoords[1][0], clickCoords[1][1]));
    vertices.push(vec2(clickCoords[0][0], clickCoords[1][1]));
  } else if (drawingShape == 2) {  // same as above but for squares
    let absDiffX = Math.abs(clickCoords[1][0] - clickCoords[0][0]);
    let absDiffY = Math.abs(clickCoords[1][1] - clickCoords[0][1]);
    let min = Math.min(absDiffX, absDiffY); // uses the minimum distance of the two to choose which length of the square's sides
    let minX = Math.min(clickCoords[1][0], clickCoords[0][0]);
    let minY = Math.min(clickCoords[1][1], clickCoords[0][1]);

    vertices.push(vec2(minX, minY));
    vertices.push(vec2((minX + min), minY));
    vertices.push(vec2((minX + min), (minY + min)));
    vertices.push(vec2(minX, (minY + min)));
  } else { // just give vertices clickCoords for all the others
    vertices = clickCoords;
  }

  let r = getFieldValue(3);
  let g = getFieldValue(4);
  let b = getFieldValue(5);

  let newShape = new Shape(shapeCount, drawingShape, vertices, r, g, b);
  shapes.push(newShape);
  shapeCount++;
  console.log(shapes);

  clickCoords = [];
  render();
}

// was handy for drawing canvas shapes: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
function render() {
  //ctx.clearRect(0, 0, 512, 512);
  // replaced clearRect with a white fillRect so when an image is downloaded, the background is white instead of black
  ctx.fillStyle = "white";
  ctx.fillRect(0,0,512,512);

  // This for loop iterates for every shape made
  for (let j = 0; j < shapeCount; j++) {
    let shapeType = shapes[j].shapeType;
    let verts = shapes[j].verts;
    let color = 'rgb(' + shapes[j].r + ',' + shapes[j].g + ',' + shapes[j].b+')';

    if (shapeType < 6) {
      // referenced for drawing polygons (most shapes): https://stackoverflow.com/questions/4839993/how-to-draw-polygons-on-an-html5-canvas
      ctx.beginPath();
      ctx.moveTo(verts[0][0], verts[0][1]);
      for (let i = 1; i < verts.length; i++) {
        ctx.lineTo(verts[i][0], verts[i][1]);
        if (shapeType <= 1) {
          ctx.strokeStyle = color;
          ctx.stroke();
        }
      }
      ctx.closePath();
      if(shapeType > 1) {
        ctx.fillStyle = color;
        ctx.fill();
      }
    } else if (shapeType >= 6) {
      if (circCanvas.getContext) {
        let x = verts[0][0]; // x coordinate
        let y = verts[0][1]; // y coordinate
        let radius = Math.sqrt(Math.pow((verts[1][0] - verts[0][0]),2) + Math.pow(verts[1][1] - verts[0][1],2)); // Arc radius
        let startAngle = 0; // Starting point on circle
        let endAngle;
        if (shapeType != 8) {
          endAngle = 2 * Math.PI; // End point on circle
        } else {
          endAngle = 1 * Math.PI; // End point on circle
        }
        let circle = new Path2D();
        ctx.beginPath();
        circle.moveTo(50, 50);
        if (shapeType == 7) {
          // ellipse function found here: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/ellipse
          ctx.ellipse(x, y, radius, radius/2, Math.PI/4 ,startAngle, endAngle);
        } else {
          ctx.arc(x, y, radius, startAngle, endAngle);
        }
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  }
  document.getElementById("status").innerHTML = "Status: Render finished. Awaiting input.";
}
