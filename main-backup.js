//
//  main.js
//
//  A project template for using arbor.js
//

function getCourseJSON(courseNumber){
    console.log("hello");
    $.getJSON("./lib/courses/" + courseNumber + ".json", function (course){
        return course;
    });
}
 
function getCourseName(courseNumber){
    var course = getCourseJSON(courseNumber);
    return course.name;
}
 
function getCourseNumber(courseNumber){
    var course = getCourseJSON(courseNumber);
    return course.number;
}
 
function getCourseUnits(courseNumber){
    var course = getCourseJSON(courseNumber);
    return course.units;
}
 
function getCourseDescription(courseNumber){
    var course = getCourseJSON(courseNumber);
    return course.description;
}
 
function getCoursePrereqs(courseNumber){
    var course = getCourseJSON(courseNumber);
    return course.name
}
 
function getCourseCoreqs(courseNumber){
    var course = getCourseJSON(courseNumber);
    return course.name
}

// Credit goes to insin from github
RegExp.prototype.findAll = function(str) {
  var match = null, results = [];
  while ((match = this.exec(str)) !== null) {
    switch (match.length) {
      case 1:
        results[results.length] = match[0];
        break;
      case 2:
        results[results.length] = match[1];
        break;
      default:
        results[results.length] = match.slice(1);
    }
    if (!this.global) {
      break;
    }
  }
  return results;
}

// Credit goes to insin from github
RegExp.findAll = function(re, str, flags) {
  if (Object.prototype.toString.call(re) != '[object RegExp]') {
    re = new RegExp(re, flags);
  }
  return re.findAll(str);
}

(function($){

  var Renderer = function(canvas){
    var canvas = $(canvas).get(0)
    var ctx = canvas.getContext("2d");
    var particleSystem

    var that = {
      init:function(system){
        //
        // the particle system will call the init function once, right before the
        // first frame is to be drawn. it's a good place to set up the canvas and
        // to pass the canvas size to the particle system
        //
        // save a reference to the particle system for use in the .redraw() loop
        particleSystem = system

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(canvas.width, canvas.height) 
        particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side
        
        // set up some event handlers to allow for node-dragging
        that.initMouseHandling()
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
        ctx.fillStyle = "white"
        ctx.fillRect(0,0, canvas.width, canvas.height)
        
        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords

          // draw a line from pt1 to pt2
          ctx.strokeStyle = "rgba(0,0,0, .333)"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(pt1.x, pt1.y)
          ctx.lineTo(pt2.x, pt2.y)
          ctx.stroke()
        })

        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords

          // draw a rectangle centered at pt
          var w = 10
          var name = node.data
          ctx.fillStyle = (node.data.alone) ? "orange" : "black"
          // ctx.fillRect(pt.x-w/2, pt.y-w/2, w,w)
          
          ctx.clearRect(pt.x-w/2, pt.y-7, w, 14)

          // draw the text
          if (name){
            ctx.font = "bold 11px Arial"
            ctx.textAlign = "center"
            ctx.fillStyle = "#888888"
            ctx.fillText(name||"", pt.x, pt.y+4)
          }
        })              
      },
      
      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        var dragged = null;

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true
            }

            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },
          dragged:function(e){
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)

            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }
        
        // start listening
        $(canvas).mousedown(handler.clicked);

      },
      
    }
    return that
  }    

  $(document).ready(function(){
    var sys = arbor.ParticleSystem(1000, 600, 0.5) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...

    // add some nodes to the graph and watch it go...

    var courses = ['15150','15122','15112'];

    $('#goButton').click(function(){
      var entryItem = $('#entry').val()
      $.getJSON("lib/courses/" + entryItem + ".json",function(result){
        sys.addNode(result.number, result.number);
      });
    })
    // Hard-coded starter values
    $.getJSON("lib/courses/21-127.json",function(course){
        console.log(course);
        sys.addNode(course.number,course.number);
        // Find all regex course numbers in prereqs
        /*var rx = new RegExp("[\d]{2}-[\d]{3}","g");
        var matches = new Array();
        while ((match = rx.exec(course.prereqs)) !== null){
            matches.push(match)
        }*/
        var matches = RegExp.class_name.prototype.method_name = function(first_argument) {
            // body...
        };
        console.log(matches);
        var i;
        for (i = 0; i < matches.length; i++) {
            sys.addNode(matches[i].number, matches[i].number);
            sys.addEdge(matches[i].number, course.number);
       }
    });
    $.getJSON("lib/courses/15-112.json",function(course){
       sys.addNode(course.number,course.number);
    });
    $.getJSON("lib/courses/15-251.json",function(course){
       sys.addNode(course.number,course.number);
    });
    sys.addEdge('15-112','15-251');
    sys.addEdge('21-127','15-251');
    // sys.addNode('f', {alone:true, mass:.25})

    // or, equivalently:
    //
    // sys.graft({
    //   nodes:{
    //     f:{alone:true, mass:.25}
    //   }, 
    //   edges:{
    //     a:{ b:{},
    //         c:{},
    //         d:{},
    //         e:{}
    //     }
    //   }
    // })


  });
  
})(this.jQuery)

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
