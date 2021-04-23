import { get_RNG } from '/vybots/tools/seedrandom.js'; 
import { grid_surface } from '/vybots/math/grid_surface.js'; 

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

export function round_sine_surface(seed,gridd,maxamp,nfacets) {
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

  let heightf = function(x, y) {
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

  let filterf = function(x0, y0, x1, y1) {
    return Math.min( Math.sqrt(x0*x0+y0*y0) , 
      Math.sqrt(x1*x1+y1*y1) , 
      Math.sqrt(x0*x0+y1*y1) ,
      Math.sqrt(x1*x1+y0*y0)) < gridd;
  };

  let n = Math.max(2, Math.min(200, nfacets));
  let geometry = grid_surface(-gridd, gridd, -gridd, gridd, n, n, heightf, filterf);
  
  return {waves:waves, geometry:geometry};
};


