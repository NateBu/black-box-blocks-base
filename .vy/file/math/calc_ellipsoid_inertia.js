(function() {
  let calc_ellipsoid_inertia = function(dx,dy,dz,density) {
    var mass = density*dx*dy*dz*4/3*Math.PI;
    var Ix = (dy*dy+dz*dz)*mass/5;
    var Iy = (dx*dx+dz*dz)*mass/5;
    var Iz = (dy*dy+dx*dx)*mass/5;
    return {mass:mass,Ix:Ix,Iy:Iy,Iz:Iz};
  };
  return {calc_ellipsoid_inertia:calc_ellipsoid_inertia};
})();