draw_new_map = function(map,g,xscale,yscale) {

  //for (var ii = 0; ii < map.shapes.length; ii++) {
    //this.g.selectAll('g.shape_id'+poly.id).remove();
    //var g = this.g.append('g')
    //  .classed('shape_id'+poly.id,true)
    //  .classed('shape',true)
    //  .attr('shape_id',poly.id,true);
  //}
    //g.selectAll('.id-'+map.id).remove();
    //var thismap = g.append('g').classed('id-'+map.id);
    g.selectAll('polygon').remove()
      .data(map.shapes)
      .enter().append('polygon')
        .attr('points', function(d,i) { 
          return d.vertices.map(function(p) { return [xscale(p.x), yscale(p.y)]; });
        })
        .style('fill','red')
        .style('opacity',0.3)
        .style('stroke','white');
}
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