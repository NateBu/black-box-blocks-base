import { get_RNG } from '/vy/vybots/tools/seedrandom.js'; 

const twopi = 2*Math.PI;
export function surface_derivatives(x, y, yaw, waves) {
    var z = 0, dzdx = 0, dzdy = 0, d2zdx2 = 0, d2zdy2 = 0, d2zdxdy = 0;
    for (let ii = 0; ii < waves.length; ii++) {
      // Length along wave ii (normalized to wavelength)
      // Each wave has [amplitude, wavelength, direction, phase]
      var amp = waves[ii].amplitude;
      var wvl = waves[ii].wavelength;
      var phi = waves[ii].azimuth;
      var psi = waves[ii].phase;
      var cq = Math.cos(phi);
      var sq = Math.sin(phi);
      var L = (x*cq + y*sq)/wvl;  var dLdx = cq/wvl;      var dLdy = sq/wvl;
      var d2Ldx2 = 0, d2Ldy2 = 0, d2Ldxdy = 0;
      var q = L*twopi+psi;        var dqdx = dLdx*twopi;  var dqdy = dLdy*twopi;
      var d2qdx2 = d2Ldx2*twopi, d2qdy2 = d2Ldy2*twopi, d2qdxdy = d2Ldxdy*twopi;
      var cq_ = Math.cos(q);
      var sq_ = Math.sin(q);
      z = z + amp*cq_;
      dzdx -= amp*dqdx*sq_;
      dzdy -= amp*dqdy*sq_;
      d2zdx2 -= amp*(d2qdx2*sq_ + dqdx*cq_*dqdx);
      d2zdy2 -= amp*(d2qdy2*sq_ + dqdy*cq_*dqdy);
      d2zdxdy -= amp*(d2qdxdy*sq_ + dqdy*cq_*dqdx);
    }
    return {z:z,dzdx:dzdx,dzdy:dzdy,d2zdx2:d2zdx2,d2zdy2:d2zdy2,d2zdxdy:d2zdxdy};
  };

export function sine_surface(seed,gridd,maxamp,nfacets) {
  // A seeded RNG (same results for = values of gridd)
  let rand = get_RNG(''+seed);
  var waves = [];
  for (var ii = 0;  ii < 10; ii++) {
    var amp = maxamp*rand();
    var wvl = Math.max(0.1,rand())*gridd;
    var phi = Math.PI*rand();
    var psi = Math.PI*rand();
    waves.push({'amplitude':amp,'wavelength':wvl,'azimuth':phi,'phase':psi});
  }

  var height = function(x, y) {
    var ztarget = 0;
    for (var ii = 0; ii < waves.length; ii++) {
      // Length along wave ii (normalized to wavelength)
      // Each wave has [amplitude, wavelength, direction, phase]
      var amp = waves[ii].amplitude;
      var wvl = waves[ii].wavelength;
      var phi = waves[ii].azimuth;
      var psi = waves[ii].phase
      var cq = Math.cos(phi);
      var sq = Math.sin(phi);
      var L = (x*cq + y*sq)/wvl;
      var q = L*2*Math.PI+psi;
      ztarget = ztarget + amp*Math.cos(q);
    }
    return ztarget;
  };

  var geometry = new THREE.Geometry();
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
      geometry.vertices.push( new THREE.Vector3(x,y,z) );
      if (c<cols && r<rows) {
        var f0 = (r)    *(cols+1) + (c) + 1;
        var f1 = (r + 1)*(cols+1) + (c) + 1;
        var f2 = (r + 1)*(cols+1) + (c);
        geometry.faces.push( new THREE.Face3( f0, f1, f2 ) );
        f0 = (r + 1)*(cols+1) + (c);
        f1 = (r)    *(cols+1) + (c);
        f2 = (r)    *(cols+1) + (c) + 1;
        geometry.faces.push( new THREE.Face3( f0, f1, f2 ) );
      }
    }
  }
  return {waves:waves, geometry:geometry};
};