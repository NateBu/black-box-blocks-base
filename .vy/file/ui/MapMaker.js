output = {
  __clear__:function() {
    this.points = [];       // Points on unclosed polygon
    this.draw();
  },
  
  __constructor__:function() {
    this.radius = 6;
    this.color = {'obstacle':'#c83232','drivable':'#3264c8','reference':'green'};
    this.dragging = false;
    this.editing = -1;
    this.movingpolygon = false;
    this.drawing = false;
    this.startPoint = undefined;
    this.xScale = null;
    this.yScale = null;
    this.drag = null;
    this.g = null;
    this.__clear__();
  },
    
  __init__:function() {
    this.draw();
  },
  
  update:function() {
    this.__publishers__.publish_map(this.__calibration__.map);
    this.__calibrate__({"map":this.__calibration__.map});
  },
  
  __d3init__:function(d3p) {
    this.xScale = d3p.xScale;
    this.yScale = d3p.yScale;
    var thisx = this;
    this.drag = d3.behavior.drag().on("drag", function(d,i) {
      thisx.handleDrag_points(this);
    }).on('dragend', function(d){
      thisx.handleDragEnd_points(this);
    });
    this.g = d3p.g;
    this.draw();
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
    return this.color.hasOwnProperty(poly.type) ? this.color[poly.type] : 'gold';
  },
  
  drawpoly:function(idx) {
    var self = this;
    if (idx >= this.__calibration__.map.shapes.length || idx < 0)
      return;
    var poly = this.__calibration__.map.shapes[idx];

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
          return d.vertices.map(function(p) { return [self.xScale(p.x), self.yScale(p.y)]; });
        })
        .style('fill',color)
        .style('fill-opacity',0.4)
        .on('dblclick', function(d,i) {
          var parent = d3.select(this.parentNode);
          if (self.editing === idx) {
            self.editing = -1;
            parent.selectAll('circle').remove();
          } else {
            var current = self.editing;
            self.editing = idx;
            self.drawpoly(current);
            self.drawpoly(idx);
          }
        })
        .style('stroke','white');
    
    g.selectAll('circle').remove();  // Remove all circles
    if (self.editing !== idx) return;
    
    g.selectAll('circle')
      .data(poly.vertices)
      .enter().append('circle')
        .attr('cx', function(d,i) { return self.xScale(d.x); })
        .attr('cy', function(d,i) { return self.yScale(d.y); })
        .attr('r', this.radius)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .style({cursor: 'move'})
        .on('contextmenu', function (d,i) {
          d3.event.preventDefault();
          d3.select(this).remove();       // Remove the circle handle
          poly.vertices.splice(i,1);      // Remove point from vertices
          if (poly.vertices.length<3) {   // Remove the whole polygon
            for (var i = self.__calibration__.map.shapes.length-1; i>=0; i--) {
              if (self.__calibration__.map.shapes[i].vertices.length < 3) {
                self.__calibration__.map.shapes.splice(i,1);
              }
            }
            g.remove();
          } else {
            self.drawpoly(idx);                      // Redraw because i will not match after you remove
          }
          self.update();
        })
        .call(this.drag);
  },
  
  drawunfinished:function() {
    this.g.selectAll('circle').remove();  // Remove all circles
    this.g.select('line').remove();       // Remove the boundary of the new shape
    this.g.select('polyline').remove();   // Remove the cursor follow line
    if (this.points.length > 0) {
      var polyline = this.g.append('polyline');
      var p = [];
      for(var i = 0; i < this.points.length; i++) {
        var pi = [this.xScale(this.points[i].x), this.yScale(this.points[i].y)];
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
    if (this.g ===  null || !this.hasOwnProperty('__calibration__')) return;
    this.drawunfinished();

    // Draw all finished polygons
    this.g.selectAll('g.shape').remove();
    for (var j = 0; j < this.__calibration__.map.shapes.length; j++) {
      this.drawpoly(j);
    }
  },
  
  handleDragEnd_points:function(self) {
    this.update();
    this.dragging = false;
  },
  
  handleDrag_points:function(self) {
    if(this.drawing || this.editing<0) return;
    this.dragging = true;
    
    // Get the polygon id
    var gparent = d3.select(self.parentNode);
    var shape_id = gparent.attr('shape_id');
    var idx = this.editing;
    
    // Move this circle
    var dragCircle = d3.select(self), newPoints = [], circle;
    dragCircle.attr('cx', d3.event.x).attr('cy', d3.event.y);
    
    // Find and update the polygon
    var x = self.getAttribute('cx');
    var y = self.getAttribute('cy');
    var poly = gparent.select('polygon');
    var circles = gparent.selectAll('circle');
    for (var i = 0; i < circles[0].length; i++) {
      var circle = d3.select(circles[0][i]);
      var x_ = circle.attr('cx');
      var y_ = circle.attr('cy');
      if ((x_===x && y_===y)) {
        this.__calibration__.map.shapes[idx].vertices[i] = {x:this.xScale.invert(x_), y:this.yScale.invert(y_)};
      } else if (d3.event.sourceEvent.shiftKey) {
        x_ = parseInt(x_)+d3.event.dx;
        y_ = parseInt(y_)+d3.event.dy;
        this.__calibration__.map.shapes[idx].vertices[i] = {x:this.xScale.invert(x_),y:this.yScale.invert(y_)};
        circle.attr('cx', x_);
        circle.attr('cy', y_);
      }
      newPoints.push([x_+'', y_+'']);
    }
    poly.attr('points', newPoints);
  },
  
  __mouseUp__:function(self, activemenu) {
    if (!activemenu) return;
    if (this.dragging) return;
    var xy = {x:d3.mouse(self)[0], y:d3.mouse(self)[1]};
    var xG = this.xScale.invert(xy.x);
    var yG = this.yScale.invert(xy.y)
    if (this.editing >= 0 && this.editing < this.__calibration__.map.shapes.length && !d3.event.shiftKey) {
      var i = this.editing;
      var n = this.__calibration__.map.shapes[i].vertices.length;
      for (var j = 0; j < n; j++) {
        var p0 = (j===0) ? this.__calibration__.map.shapes[i].vertices[n-1] : this.__calibration__.map.shapes[i].vertices[j-1];
        var p1 = this.__calibration__.map.shapes[i].vertices[j];
        p0 = {x:this.xScale(p0.x),y:this.yScale(p0.y)};
        p1 = {x:this.xScale(p1.x),y:this.yScale(p1.y)};
        if (this.onsegment(xy, p0, p1, this.radius)) { // in screen coordinates
          this.__calibration__.map.shapes[i].vertices.splice(j,0,{x:xG,y:yG});
          this.drawpoly(i);
          this.update();
          return;
        }
      }
    } else if (d3.event.shiftKey) {
      this.drawing = true;
      this.startPoint = xy;
      this.points.push({x:xG , y:yG});
      this.drawunfinished();
    }
  },
  
  __mouseMove__:function(self, activemenu) {
    if (!activemenu) return;
    if(!this.drawing) return;
    this.g.select('line').remove();
    this.g.append('line')
      .attr('x1', this.startPoint.x)
      .attr('y1', this.startPoint.y)
      .attr('x2', d3.mouse(self)[0] + 2)
      .attr('y2', d3.mouse(self)[1])
      .attr('stroke', '#53DBF3')
      .attr('stroke-width', 1);      
  },
  
  __keyUp__:function(self, activemenu) {
    if (!activemenu) return;
    var key = d3.event.keyCode;
    if (key==16) {
      if (this.points.length > 2) {
        var id = math.random().toString(36).slice(2);
        var v = this.points.splice(0);
        var area = polygon_area.signed_area(v);
        var typ = (area > 0) ? 'drivable' : 'obstacle';
        this.__calibration__.map.shapes.push({'vertices':v,'id':id,'type':typ}); // move unclosed point to the closed set
        this.update();
        this.editing = this.__calibration__.map.shapes.length-1;
      }
      this.drawunfinished();
      this.drawpoly(this.__calibration__.map.shapes.length-1);
      this.drawing = false;
    }
  },
  
  set_map:function(msg) {
    this.__clear__();
    if (msg && msg.hasOwnProperty('shapes') ) {
      if (msg.shapes.length > 0 && msg.shapes[0].hasOwnProperty('vertices') && msg.shapes[0].vertices.length > 0) {
        console.log('First vertex:',msg.shapes[0].vertices[0])
      }
      this.__calibrate__({"map":msg});
    }
    this.draw();
  },
  
  __zoom__:function(self) {
    this.draw();
  }
};