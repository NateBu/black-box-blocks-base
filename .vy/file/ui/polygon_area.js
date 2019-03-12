(function() {
  let signed_area = function(vertices) {
    var area = 0;
    for (var ii=0; ii<vertices.length; ii++) {
      var jj = (ii+1) % vertices.length;
      area += (vertices[ii].x*vertices[jj].y - vertices[jj].x*vertices[ii].y);
    }
    return area/2;
  };  
  return {signed_area:signed_area};
})