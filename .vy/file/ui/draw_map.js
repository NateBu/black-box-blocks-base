(function() {
  let draw_new_map = function(map,g,xscale,yscale) {
  
    //for (var ii = 0; ii < map.shapes.length; ii++) {
      //this.g.selectAll('g.shape_id'+poly.id).remove();
      //var g = this.g.append('g')
      //  
      //  .attr('shape_id',poly.id,true);
    //}
      var colors = {'drivable':'blue','obstacle':'red','reference':'orange',
                '"drivable"':'blue','"obstacle"':'red','"reference"':'orange'};
      var thismap = g.selectAll('.id-'+map._id);
      var mappolygons = null;
      if (thismap.size() === 0) {
        thismap = g.append('g').classed('id-'+map._id,true);
        mappolygons = thismap.selectAll('polygon').remove()
          .data(map._mapShapes)
          .enter().append('polygon').style('fill',function(d,i) { 
            return colors[d._shapeType] || 'black';
          })
          .classed('mapshape',true)
          .style('opacity',0.3)
          .style('stroke','white');
      } else {
        mappolygons = thismap.selectAll('polygon');
      }
      
      mappolygons.attr('points', function(d,i) { 
        return d._vertices.map(function(p) { return [xscale(p.x), yscale(p.y)]; });
      });
  }
  
  let draw_shapes = function(shapes,g,xscale,yscale,style,cls) {
    if (!shapes) return;
    g.selectAll('.shape_'+cls).remove();
    var shapep = function(d,i) { 
      var v = (d.hasOwnProperty('vertices')) ? d.vertices : d._vertices;
      return v.map( function(p_) {
        return [xscale(p_.x).toFixed(2), yscale(p_.y).toFixed(2)];
      });
    };
    var styfun = function(d,i) {
      var typ = (d.hasOwnProperty('_shapeType')) ? ''+d._shapeType.slice(1,-1) : ''+d.type;
      // why are there quotes? 
      if (typeof style === 'string') {
        return style;
      } else if (typeof style === 'object' && style.hasOwnProperty(typ)) {
        return 'stroke:'+style[typ]+';fill:'+style[typ]+';fill-opacity:0.4';
      }
      return 'stroke:green;fill:green;fill-opacity:0.4';
    };
    g.selectAll('polygon').data(shapes)
      .enter().append('polygon').attr({'points':shapep,'style':styfun})
      .classed('shape_'+cls,true);
  };

  let draw_oriented_points = function(g_,xScale,yScale,pointlist,vlength,color,cls) {
    g_.selectAll('g.'+cls).remove();
    var g = g_.append('g').classed(cls,true);
    //g.selectAll('circle').remove();
    //g.selectAll('polyline').remove();
    //g.selectAll('line').remove();
    g.selectAll('circle').data(pointlist).enter().append('circle')
      .attr('cx',function(d,i) {return xScale(d.x)})
      .attr('cy',function(d,i) {return yScale(d.y)})
      .attr('r',3)
      .style('fill',color);
    g.selectAll('line').data(pointlist).enter().append('line')
      .attr('x1',function(d,i) {return xScale(d.x)})
      .attr('y1',function(d,i) {return yScale(d.y)})
      .attr('x2',function(d,i) {return xScale(d.x+vlength*Math.cos(d.q))})
      .attr('y2',function(d,i) {return yScale(d.y+vlength*Math.sin(d.q))})
      .style('stroke',color);
  };
  
  let draw_polyline = function(g_, xScale, yScale, points, style, cls) {
    g_.selectAll('g.'+cls).remove();
    var g = g_.append('g').classed(cls,true);
    var p = points.map(function(p) { return [xScale(p.x),yScale(p.y)]; });
    g.append('polyline').attr({'points':p,'style':style});
  };
  
  let draw_segments = function(g_, xScale, yScale, seglist, cls) {
    g_.selectAll('g.'+cls).remove();
    var g = g_.append('g').classed(cls,true);
    //g.selectAll('line').remove();
    g.selectAll('line').data(seglist).enter().append('line')
      .attr('x1',function(d,i) { return xScale(d.x1); })
      .attr('y1',function(d,i) { return yScale(d.y1); })
      .attr('x2',function(d,i) { return xScale(d.x2); })
      .attr('y2',function(d,i) { return yScale(d.y2); })
      .style('stroke',function(d,i) { return (d.color) ? d.color : 'black'; });
  };

  return {
    draw_new_map:draw_new_map,
    draw_shapes:draw_shapes,
    draw_polyline:draw_polyline,
    draw_segments:draw_segments,
    draw_oriented_points:draw_oriented_points
  };
})();
  
  /*
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
  */