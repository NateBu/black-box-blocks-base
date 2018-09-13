draw_new_grid = function(grid,g,xscale,yscale,redraw) {
  
    var thisgrid = g.selectAll('image');
    var w = Math.abs(xscale(grid.info.resolution*grid.info.width_cells) - xscale(0));
    var h = Math.abs(yscale(grid.info.resolution*grid.info.height_cells) - yscale(0));
    var res = grid.info.resolution;
    var x0 = grid.info.origin.x;
    var y0 = grid.info.origin.y;
    if (thisgrid.size() === 0 || redraw) {
      thisgrid.remove();
      thisgrid = g.append('image').attr('xlink:href',"data:image/png;base64, "+grid.data)
        .attr('opacity',0.3);
    }
    thisgrid.attr('x',xscale(x0)).attr('y',yscale(y0)-h).attr('height',h).attr('width',w);
    
    /*if (thisgrid.size() !== grid.data.length) {
      thisgrid.remove().data(grid.data)
        .enter().append('rect').attr('width',w).attr('height',h)
        .attr('x', function (d,i) { return xscale(x0 + res*(i % grid_width)); })
        .attr('y', function (d,i) { return yscale(y0 + res*Math.floor(i/grid_width)); })
        .style('fill',function(d,i) {
          return (d>0) ? 'red' : 'white';
        })
        .style('opacity',0.3);
    }*/

}