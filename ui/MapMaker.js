output = {
  constructor:function() {
    this.radius = 6;
    this.color = {'obstacle':'#c83232','drivable':'#3264c8'};
    this.dragging = false;
    this.drawing = false;
    this.startPoint = undefined;
    this.points = [];       // Points on unclosed polygon
    this.polygons = [];     // Closed polygons
    this.xScale = null;
    this.yScale = null;
    this.drag = null;
    this.g = null;
    this.single_pixel_scale = 1;
  },
  
  calibrate:function(context) {
    this.polygons = []; this.points = []
    if (this.g) this.draw();
    if (context.calibration.hasOwnProperty('map') && context.calibration.map.hasOwnProperty('shapes') ) {
      this.polygons = context.calibration.map.shapes.map(function(s) {
        var v = s.vertices.map(function(v) {return [v.x,v.y]});
        return {'vertices':v,'editing':false,'type':s.type,'id':s.id};
      });
    }
    this.context = context;
    if (this.g) this.draw();
  },
  
  initialize:function(xScale,yScale,g) {
    this.xScale = xScale;
    this.yScale = yScale;
    var thisx = this;
    this.drag = d3.behavior.drag().on("drag", function(d,i) {
      thisx.handleDrag_points(this);
    }).on('dragend', function(d){
      thisx.handleDragEnd_points(this);
    });
    this.g = g;
    this.draw();
  },
  
  to_map:function() {
    var resp = {id:0,attributes:[],shapes:[]};
    for (var ii=0; ii<this.polygons.length; ii++) {
      var p = this.polygons[ii];
      var v = p.vertices.map(function(v) {return {x:v[0],y:v[1]};});
      resp.shapes.push({id:p.id,type:p.type,attributes:[],vertices:v});
    }
    return resp;
  },
  
  onsegment:function(p, v, w, thresh) {
    function sqr(x) { return x * x }
    function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
    var l2 = dist2(v, w);
    if (l2 === 0) return false;
    var thresh2 = thresh*thresh;
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    var tnrm = thresh/Math.sqrt(l2);
    if (t<=tnrm || t>=(1-tnrm)) return false; // not between v and w or very close to v/w
    return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }) < thresh2;
  },
  
  polygonColor:function(poly) {
    return this.color.hasOwnProperty(poly.type) ? this.color[poly.type] : 'white';
  },
  
  polygonHandles:function(g,poly) {
    var self = this;
    var color = this.polygonColor(poly);
    g.selectAll('circle').remove();  // Remove all circles
    g.selectAll('circle')
      .data(poly.vertices)
      .enter().append('circle')
        .attr('cx', function(d,i) { return self.xScale(d[0]); })
        .attr('cy', function(d,i) { return self.yScale(d[1]); })
        .attr('r', this.radius)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('is-handle', 'true')
        .style({cursor: 'move'})
        .on('dblclick', function (d,i) {
          d3.event.preventDefault();
          d3.select(this).remove();       // Remove the circle handle
          poly.vertices.splice(i,1);      // Remove point from vertices
          if (poly.vertices.length<3) {   // Remove the whole polygon
            for (var i = self.polygons.length-1; i>=0; i--) {
              if (self.polygons[i].vertices.length < 3) {
                self.polygons.splice(i,1);
              }
            }
            g.remove();
          } else {
            self.drawpoly(poly);                      // Redraw because i will not match after you remove
          }

          /*
          // Remove the points from the polygon
          var p = g.select('polygon').attr('points').split(',')
          p.splice(i*2,2);
          g.select('polygon').attr('points',p.join(','));
          */

        })
        .call(this.drag);
  },
  
  drawpoly:function(poly) {
    var self = this;
    var color = this.polygonColor(poly);
    this.g.selectAll('g.shape_id'+poly.id).remove();
    var g = this.g.append('g')
      .classed('shape_id'+poly.id,true)
      .classed('shape',true)
      .attr('shape_id',poly.id,true);
    g.selectAll('polygon')
      .data([poly])
      .enter().append('polygon')
        .attr('points', function(d,i) { 
          return d.vertices.map(function(p) { return [self.xScale(p[0]), self.yScale(p[1])]; });
        })
        .style('fill',color)
        .on('dblclick', function(d,i) { 
          d.editing = !d.editing ; 
          var parent = d3.select(this.parentNode);
          if (d.editing) {
            // Add handles
            self.polygonHandles(parent,d);
          } else {
            // Remove handles
            parent.selectAll('circle').remove();
          }
        })
        .style('stroke','white');
    if (poly.editing) this.polygonHandles(g,poly);
  },
  
  drawunfinished:function() {
    this.g.selectAll('circle').remove();  // Remove all circles
    this.g.select('line').remove();       // Remove the boundary of the new shape
    this.g.select('polyline').remove();   // Remove the cursor follow line
    if (this.points.length > 0) {
      var polyline = this.g.append('polyline');
      var p = [];
      for(var i = 0; i < this.points.length; i++) {
        var pi = [this.xScale(this.points[i][0]), this.yScale(this.points[i][1])];
        p.push(pi);
        var circle = this.g.append('circle')
          .attr('cx', pi[0])
          .attr('cy', pi[1])
          .attr('r', this.radius)
          .attr('fill', 'white')
          .attr('stroke', '#000')
          .style({cursor: 'pointer'});
      }
      polyline.attr('points', p).style('fill', 'none').attr('stroke', '#000');
    }
  },
  
  draw:function() {
    // Draw unfinished polygon
    this.drawunfinished();

    // Draw all finished polygons
    this.g.selectAll('g.shape').remove();
    for (var j = 0; j < this.polygons.length; j++) {
      this.drawpoly(this.polygons[j]);
    }
  },
  
  handleDragEnd_points:function(self) {
    this.dragging = false;
  },
  
  handleDrag_points:function(self) {
    if(this.drawing) return;
    this.dragging = true;
    
    //var ActiveD3 = Session.get('ActiveD3');
    //if (ActiveD3.active_id == '') return;   // Don't drag if panzoom is enabled
    
    // Get the polygon id
    var gparent = d3.select(self.parentNode);
    var shape_id = gparent.attr('shape_id');
    if (!shape_id) return;
    var idx = -1;
    for (var j = 0; j<this.polygons.length; j++) {
      if (shape_id == this.polygons[j].id) {
        idx = j;
      }
    }
    if (idx==-1) return;


    // Move this circle
    var dragCircle = d3.select(self), newPoints = [], circle;
    dragCircle.attr('cx', d3.event.x).attr('cy', d3.event.y);

    // Find and update the polygon
    var x = self.getAttribute('cx');
    var y = self.getAttribute('cy');
    var poly = gparent.select('polygon');
    var circles = gparent.selectAll('circle');
    var p = []
    for (var i = 0; i < circles[0].length; i++) {
      var circle = d3.select(circles[0][i]);
      if (circle.attr('cx')===x && circle.attr('cy')===y) {
        this.polygons[idx].vertices[i] = [this.xScale.invert(x),this.yScale.invert(y)];
      }
      newPoints.push([circle.attr('cx'), circle.attr('cy')]);
    }
    poly.attr('points', newPoints);
  },
  
  mouseUp:function(self) {
    if (this.dragging) return;
    var xy = [d3.mouse(self)[0], d3.mouse(self)[1]];
    var xG = this.xScale.invert(xy[0]);
    var yG = this.yScale.invert(xy[1])
    if (!d3.event.shiftKey) {
      for (var i = this.polygons.length-1; i>=0; i--) {
        var n = this.polygons[i].vertices.length;
        for (var j = 0; j < n; j++) {
          var p0 = (j===0) ? this.polygons[i].vertices[n-1] : this.polygons[i].vertices[j-1];
          var p1 = this.polygons[i].vertices[j];
          p0 = {x:this.xScale(p0[0]),y:this.yScale(p0[1])};
          p1 = {x:this.xScale(p1[0]),y:this.yScale(p1[1])};
          if (this.onsegment({x:xy[0],y:xy[1]}, p0, p1, this.radius)) { // in screen coordinates
            this.polygons[i].vertices.splice(j,0,[xG,yG]);
            this.drawpoly(this.polygons[i]);
            return;
          }
        }
      }
    } else {
      this.drawing = true;
      this.startPoint = xy;
      this.points.push([xG , yG]);
      this.drawunfinished();
    }
  },
  
  mouseMove:function(self) {
    if(!this.drawing) return;
    this.g.select('line').remove();
    this.g.append('line')
      .attr('x1', this.startPoint[0])
      .attr('y1', this.startPoint[1])
      .attr('x2', d3.mouse(self)[0] + 2)
      .attr('y2', d3.mouse(self)[1])
      .attr('stroke', '#53DBF3')
      .attr('stroke-width', 1);      
  },
  
  keyUp:function(self) {
    var key = d3.event.keyCode;
    if (key==16) {
      if (this.points.length > 2) {
        var id = math.random().toString(36).slice(2);
        var v = this.points.splice(0);
        var area = polygon_area.signed_area(v.map(function(vi) {
          return {x:vi[0],y:vi[1]};
        }));
        var typ = (area > 0) ? 'drivable' : 'obstacle';
        this.polygons.push({'vertices':v,'id':id,'type':typ,'editing':true}); // move unclosed point to the closed set
      }
      this.drawunfinished();
      this.drawpoly(this.polygons[this.polygons.length-1]);
      this.drawing = false;
    } else if (key == 77) {
      this.context.calibration.__set__('map',this.to_map());
    }
  },
  
  map_request:function(msg) {
    this.context.publishers.map_response(this.to_map());
  },
  
  zoom:function(self) {
    this.single_pixel_scale = this.xScale.invert(1)-this.xScale.invert(0);
    this.draw();
  }
}