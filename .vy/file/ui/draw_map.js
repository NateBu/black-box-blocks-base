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
  
  return {draw_new_map:draw_new_map};
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