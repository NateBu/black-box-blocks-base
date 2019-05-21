(function() {
  let calc_box_inertia = function(dx,dy,dz,density) {
    var mass = density*dx*dy*dz;
    var Ix = (dy*dy+dz*dz)*mass/12;
    var Iy = (dx*dx+dz*dz)*mass/12;
    var Iz = (dy*dy+dx*dx)*mass/12;
    return {mass:mass,Ix:Ix,Iy:Iy,Iz:Iz};
  };
  return {calc_box_inertia:calc_box_inertia};
})();