sinesurface = function(seed,gridd,maxamp,nfacets) {
  // A seeded RNG (same results for = values of gridd)
  Math.seedrandom(''+seed+'')
  var waves = [];
  for (var ii = 0;  ii < 10; ii++) {
    var amp = maxamp*Math.random();
    var wvl = Math.max(.1,Math.random())*gridd;
    var phi = Math.PI*Math.random();
    var psi = Math.PI*Math.random();
    waves.push([amp,wvl,phi,psi])
  }
  //waves = [[0.0,10.0,Math.PI/2.0,0.1]]
  
  
  var vertices = [];
  var facets = [];
  
  var height = function(x, y) {
    var ztarget = 0;
    for (ii = 0; ii < waves.length; ii++) {
      // Length along wave ii (normalized to wavelength)
      // Each wave has [amplitude, wavelength, direction, phase]
      var amp = waves[ii][0]; // amplitude
      var wvl = waves[ii][1]; // wavelength
      var phi = waves[ii][2]; // direction
      var psi = waves[ii][3]; // phase
      var cq = Math.cos(phi);
      var sq = Math.sin(phi);
      var L = (x*cq + y*sq)/wvl;
      var q = L*2*Math.PI+psi;
      ztarget = ztarget + amp*Math.cos(q);
    }
    return ztarget;
  };
  
  var twopi = 2*Math.PI;
  var surface_derivatives = function(x, y, yaw) {
    var z = 0, dzdx = 0, dzdy = 0;
    for (ii = 0; ii < waves.length; ii++) {
      // Length along wave ii (normalized to wavelength)
      // Each wave has [amplitude, wavelength, direction, phase]
      var amp = waves[ii][0]; // amplitude
      var wvl = waves[ii][1]; // wavelength
      var phi = waves[ii][2]; // direction
      var psi = waves[ii][3]; // phase
      var cq = Math.cos(phi);
      var sq = Math.sin(phi);
      var L = (x*cq + y*sq)/wvl;  var dLdx = cq/wvl;      var dLdy = sq/wvl;
      var q = L*twopi+psi;        var dqdx = dLdx*twopi;  var dqdy = dLdy*twopi;
      var cq_ = Math.cos(q);
      var sq_ = Math.sin(q);
      z = z + amp*cq_;            dzdx -= amp*dqdx*sq_;   dzdy -= amp*dqdy*sq_;
    }
    return {z:z,dzdx:dzdx,dzdy:dzdy};
  };
  
  var d = gridd;
  var n = Math.max(2,Math.min(200,nfacets));
  var xmax = d, xmin = -d, ymax = d, ymin = -d;
  var cols = n;
  var rows = n;
  var yspc = (ymax-ymin)/rows;
  var xspc = (xmax-xmin)/cols;
  for (var r = 0; r <= rows; r++) {
    for (var c = 0; c <= cols; c++) {
      var x = xmin + c*xspc;
      var y = ymin + r*yspc;
      var z = height(x,y);
      vertices.push( [x, y, z] );
      if (c<cols && r<rows) {
        var f0 = (r)    *(cols+1) + (c) + 1;
        var f1 = (r + 1)*(cols+1) + (c) + 1;
        var f2 = (r + 1)*(cols+1) + (c);
        facets.push([f0, f1, f2]);
        f0 = (r + 1)*(cols+1) + (c);
        f1 = (r)    *(cols+1) + (c);
        f2 = (r)    *(cols+1) + (c) + 1;
        facets.push([f0, f1, f2]);
      }
    }
  }
  // 0.781346917786, -0.003739250431392, 1.614568446468,
  // data.waves = height(0.7813,-.0037); //0.42078
  return {
    waves:waves,
    vertices:vertices,
    facets:facets,
    surface_derivatives:surface_derivatives
  };
};