//
//  main.js
//
//  A project template for using arbor.js
//

var sys = arbor.ParticleSystem(200, 600, 0); // create the system with sensible repulsion/stiffness/friction

function addNodeWrapper(course){
    sys.addNode(course.number, course.number);
        //Recursively add prereqs
        for (var i = 0; i < course.prereqs.length; i++){
            console.log(course.prereqs[i])
            getCourseJSON(course.prereqs[i], addNodeWrapper);
            sys.addEdge(course.prereqs[i], course.number);
        }
        //Recursively add coreqs
        for (var i = 0; i < course.coreqs.length; i++){
            getCourseJSON(course.coreqs[i], addNodeWrapper);
            sys.addEdge(course.coreqs[i], course.number);
        }
}

function getCourseJSON(courseNumber, callback){
    $.getJSON("lib/courses/" + courseNumber + ".json", function(course){
            callback(course);
        });
}
function getCourseName(courseNumber, callback){
    getCourseJSON(courseNumber, function(course){
        callback(course.name);}
    );
}
 
function getCourseNumber(courseNumber, callback){
    getCourseJSON(courseNumber, function(course){
        callback(course.number);}
    );
}
 
function getCourseUnits(courseNumber, callback){
    getCourseJSON(courseNumber, function(course){
        callback(course.units);}
    );
}
 
function getCourseDescription(courseNumber, callback){
    getCourseJSON(courseNumber, function(course){
        callback(course.description);}
    );
}
 
function getCoursePrereqs(courseNumber, callback){
    getCourseJSON(courseNumber, function(course){
        callback(course.prereqs);}
    );
}
 
function getCourseCoreqs(courseNumber, callback){
    getCourseJSON(courseNumber, function(course){
        callback(course.coreqs);}
    );
}

(function($){

  var Renderer = function(canvas){
    var canvas = $(canvas).get(0);
    var ctx = canvas.getContext("2d");
    var gfx = arbor.Graphics(canvas);
    var particleSystem;

    var that = {
      init:function(system){
        //
        // the particle system will call the init function once, right before the
        // first frame is to be drawn. it's a good place to set up the canvas and
        // to pass the canvas size to the particle system
        //
        // save a reference to the particle system for use in the .redraw() loop
        particleSystem = system;

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(canvas.width, canvas.height);
        particleSystem.screenPadding(80); // leave an extra 80px of whitespace per side
        
        // set up some event handlers to allow for node-dragging
        that.initMouseHandling();
      },
      
      redraw:function(){
        // 
        // redraw will be called repeatedly during the run whenever the node positions
        // change. the new positions for the nodes can be accessed by looking at the
        // .p attribute of a given node. however the p.x & p.y values are in the coordinates
        // of the particle system rather than the screen. you can either map them to
        // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
        // which allow you to step through the actual node objects but also pass an
        // x,y point in the screen's coordinate system
        // 
        ctx.fillStyle = "white";
        ctx.fillRect(0,0, canvas.width, canvas.height);
        
        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords

          // draw a line from pt1 to pt2
          ctx.strokeStyle = "rgba(0,0,0, .333)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        });

        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords

          // draw a rectangle centered at pt
          var w = 50;
          var name = node.data;
          // ctx.fillStyle = (node.data.alone) ? "orange" : "black";
          ctx.fillStyle = "#577492";
          gfx.oval(pt.x-w/2, pt.y-w/2, w,w, {fill:ctx.fillStyle})
          // nodeBoxes[node.name] = [pt.x-w/2, pt.y-11, w, 22]
          // ctx.fillRect(pt.x-w/2, pt.y-w/2, w,w)
          
          // ctx.clearRect(pt.x-w/2, pt.y-7, w, 14);

          // draw the text
          if (name){
            ctx.font = "12px Helvetica";
            ctx.textAlign = "center";
            ctx.fillStyle = "#EFEFEF";
            ctx.fillText(name||"", pt.x, pt.y+4);
          }
        }) ;             
      },
      
      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        var dragged = null;

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);
            dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true;
            }

            $(canvas).bind('mousemove', handler.dragged);
            $(window).bind('mouseup', handler.dropped);

            return false;
          },
          dragged:function(e){
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top);

            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s);
              dragged.node.p = p;
            }

            return false;
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return;
            if (dragged.node !== null) dragged.node.fixed = false;
            dragged.node.tempMass = 1000;
            dragged = null;
            $(canvas).unbind('mousemove', handler.dragged);
            $(window).unbind('mouseup', handler.dropped);
            _mouseP = null;
            return false;
          }
        };
        
        // start listening
        $(canvas).mousedown(handler.clicked);

      },
      
    };
    return that;
  };
  
  $(document).ready(function(){
    sys.parameters({gravity:true}); // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport"); // our newly created renderer will have its .init() method called shortly by sys...
    // add some nodes to the graph and watch it go...

    $('#goButton').click(function(){
      var entryItem = $('#entry').val();
      // var description = getCourseDescription(entryItem);
      // console.log(description);
      $.getJSON("lib/courses/" + entryItem + ".json", function(result){
        console.log("lib/courses/" + entryItem + ".json");
        console.log(result);
        addNodeWrapper(result);
      });
    });
  });
  
})(this.jQuery);

/*function addUsersNode(){
  var sys = arbor.ParticleSystem(1000, 600, 0.5) // create the system with sensible repulsion/stiffness/friction
  sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
  sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

  var entryItem = $('#entry').val()
  alert(entryItem)
  $.getJSON("lib/courses/" + entryItem + ".json",function(result){
      sys.addNode(result["number"],result["number"]);
  });
  return
}*/
