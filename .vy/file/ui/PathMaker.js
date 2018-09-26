output = {
  __clear__: function() {
  },
  
  __constructor__:function() {
    this.radius = 6;
    this.dragging = false;
    this.drawing = -1;
    this.xScale = null;
    this.yScale = null;
    this.drag = null;
    this.g = null;
    this.__clear__();
  },
  
  update:function() {
    this.__calibrate__({'pathlist':this.__calibration__.pathlist});
  },
  
  __init__:function() {
    if (!this.__calibration__.pathlist.hasOwnProperty('paths')) {
      this.__calibration__.pathlist = {paths:[]};
      this.update();
    } else {
      this.draw();
    }
  },
  
  __d3init__:function(d3p) {
    this.xScale = d3p.xScale;
    this.yScale = d3p.yScale;
    var self = this;
    this.drag = d3.behavior.drag().on("drag", function(d,i) {
      self.handleDrag_points(this);
    }).on('dragend', function(d){
      self.handleDragEnd_points(this);
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
  
  pathColor:function(poly) {
    return 'red';
  },
  
  pathHandles:function(g,path) {
    var self = this;
    var color = this.pathColor(path);
    //g.selectAll('circle').remove();  // Remove all circles
    var handles = g.selectAll('circle').data(path.vertices).enter().append('circle')
      .attr('cx', function(d,i) { return self.xScale(d.x); })
      .attr('cy', function(d,i) { return self.yScale(d.y); })
      .attr('r', this.radius)
      .attr('fill', 'red')
      .attr('stroke', '#fff')
      .style({cursor: 'move'})
      .on("contextmenu", function (d, i) {
        d3.event.preventDefault();
        d3.select(this).remove();       // Remove the circle handle
        path.vertices.splice(i,1);      // Remove point from vertices
        if (path.vertices.length<2) {   // Remove the whole path
          for (var i = self.__calibration__.pathlist.paths.length-1; i>=0; i--) {
            if (self.__calibration__.pathlist.paths[i].vertices.length < 2) {
              self.__calibration__.pathlist.paths.splice(i,1);
              self.update()
            }
          }
          g.remove();
        } else {
          self.draw();// Redraw because i will not match after you remove
        }
      })
      .call(self.drag);
  },
  
  draw:function() {
    if (this.g === null || !this.hasOwnProperty('__calibration__')) return;
    var self = this;
    this.g.select('line').remove();
    this.g.selectAll('g.path').remove();
    for (var j = 0; j < this.__calibration__.pathlist.paths.length; j++) {
      var path = this.__calibration__.pathlist.paths[j];
      var color = this.pathColor(path);
      this.g.selectAll('g.path_id'+path.id).remove();
      var g = this.g.append('g')
        .classed('path_id'+path.id,true)
        .classed('path',true)
        .attr('path_id',path.id,true);
      g.selectAll('polyline')
        .data([path])
        .enter().append('polyline')
          .attr('points', function(d,i) { 
            return d.vertices.map(function(p) { return [self.xScale(p.x), self.yScale(p.y)]; });
          })
          .style('fill','none')
          .style('stroke','black');
      
      if (this.drawing == j) this.pathHandles(g,path);
      
    }
  },
  
  handleDragEnd_points:function(self) {
    this.update();
    this.dragging = false;
  },
  
  handleDrag_points:function(self) {
    this.dragging = true;
    
    // Get the path id
    var gparent = d3.select(self.parentNode);
    var idx = this.drawing;  

    // Move this circle
    var dragCircle = d3.select(self), newPoints = [], circle;
    dragCircle.attr('cx', d3.event.x).attr('cy', d3.event.y);
    
    // Find and update the path
    var x = self.getAttribute('cx');
    var y = self.getAttribute('cy');
    var poly = gparent.select('polyline');
    var circles = gparent.selectAll('circle');
    for (var i = 0; i < circles[0].length; i++) {
      var circle = d3.select(circles[0][i]);
      var x_ = circle.attr('cx');
      var y_ = circle.attr('cy');
      if ((x_===x && y_===y)) {
        this.__calibration__.pathlist.paths[idx].vertices[i] = {x:this.xScale.invert(x_),y:this.yScale.invert(y_)};
      } else if (d3.event.sourceEvent.shiftKey) {
        x_ = parseInt(x_) + d3.event.dx;
        y_ = parseInt(y_) + d3.event.dy;
        this.__calibration__.pathlist.paths[idx].vertices[i] = {x:this.xScale.invert(x_),y:this.yScale.invert(y_)};
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
    var xS = d3.mouse(self)[0]
    var yS = d3.mouse(self)[1];
    var xG = this.xScale.invert(xS);
    var yG = this.yScale.invert(yS)
    if (!d3.event.shiftKey) {
      for (var i = this.__calibration__.pathlist.paths.length-1; i>=0; i--) {
        var n = this.__calibration__.pathlist.paths[i].vertices.length;
        for (var j = 1; j < n; j++) {
          var p0 = this.__calibration__.pathlist.paths[i].vertices[j-1];
          var p1 = this.__calibration__.pathlist.paths[i].vertices[j];
          p0 = {x:this.xScale(p0.x),y:this.yScale(p0.y)};
          p1 = {x:this.xScale(p1.x),y:this.yScale(p1.y)};
          if (this.onsegment({x:xS,y:yS}, p0, p1, this.radius)) { // in screen coordinates
            if (this.drawing === i) {
              this.__calibration__.pathlist.paths[i].vertices.splice(j,0,{x:xG,y:yG});
            } else {
              this.drawing = i;
            }
            this.draw();
            this.update();
            return;
          }
        }
      }
    } else {
      if (this.drawing === -1) {
        this.drawing = this.__calibration__.pathlist.paths.length;
        var id = math.random().toString(36).slice(2);
        this.__calibration__.pathlist.paths.push({'id':id,'vertices':[{x:xG,y:yG}]});
      } else {
        this.__calibration__.pathlist.paths[this.drawing].vertices.push({x:xG,y:yG});
      }
      this.update();
    }
    this.draw();
  },
  
  __mouseMove__:function(self, activemenu) {
    if (!activemenu) return;
    if (this.drawing < 0 || !d3.event.shiftKey) return;
    this.g.select('line').remove();
    var v = this.__calibration__.pathlist.paths[this.drawing].vertices;
    var p = v[v.length-1];
    this.g.append('line')
      .attr('x1', this.xScale(p.x))
      .attr('y1', this.yScale(p.y))
      .attr('x2', d3.mouse(self)[0] + 2)
      .attr('y2', d3.mouse(self)[1])
      .attr('stroke', '#53DBF3')
      .attr('stroke-width', 1);      
  },
  
  __keyUp__:function(self, activemenu) {
    if (!activemenu) return;
    var key = d3.event.keyCode;
    if (key==16) {
      if (this.drawing>=0 && this.__calibration__.pathlist.paths[this.drawing].vertices.length < 2) {
        this.__calibration__.pathlist.paths.splice(this.drawing,1);
        this.update();
      }
      this.drawing = -1;
      this.draw();
    }
  },
  
  path_request:function(msg) {
    this.update();
    this.__publishers__.path_response(this.__calibration__.pathlist);
  },
  
  __zoom__:function(self) {
    this.draw();
  }
}