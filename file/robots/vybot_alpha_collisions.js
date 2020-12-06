export function collisions(swarm, coefficient_of_restitution, xbody) {
  var shieldp = [];
  let collis = [];
  for (var ii in swarm) {
    var boti = swarm[ii];
    var com = boti.shield;
    var pi = xbody.l2g(new THREE.Vector3(com.x,com.y,com.z), boti.chassis_name);
    for (var jj in shieldp) {
      var botj = swarm[jj];
      var pj = shieldp[jj];
      var dx = pi.x-pj.x;
      var dy = pi.y-pj.y;
      var dz = pi.z-pj.z;
      var dmag = Math.sqrt(dx*dx+dy*dy+dz*dz);
      let doverlap = (boti.shield.radius+botj.shield.radius) - dmag;
      if (doverlap > 0) {
        dx = dx/dmag; dy = dy/dmag; dz = dz/dmag;
        boti.state.x += dx*doverlap/2;
        boti.state.y += dy*doverlap/2;
        botj.state.x -= dx*doverlap/2;
        botj.state.y -= dy*doverlap/2;
        collis.push({ii:ii,jj:jj,dx:dx,dy:dy,dz:dz});
        var mi = boti.mass;
        var mj = botj.mass;
        // velocities perpendicular to collision before collision
        var viperp = boti.state.vx*dx+boti.state.vy*dy+boti.state.vz*dz;
        var vjperp = botj.state.vx*dx+botj.state.vy*dy+botj.state.vz*dz;
        if (viperp > 0 && vjperp < 0) continue; // Already moving away from each other
        var p = viperp*mi+vjperp*mj; // Momentum in direction of collision
        var f = Math.sqrt(Math.min(1,Math.max(0, coefficient_of_restitution)))/(mi+mj);
        var vi = f*(viperp*(mi-mj)+2*mj*vjperp);
        var vj = f*(vjperp*(mj-mi)+2*mi*viperp);
        
        boti.state.vx -= dx*(viperp-vi);
        boti.state.vy -= dy*(viperp-vi);
        boti.state.vz -= dz*(viperp-vi);
        botj.state.vx -= dx*(vjperp-vj);
        botj.state.vy -= dy*(vjperp-vj);
        botj.state.vz -= dz*(vjperp-vj);
        if (boti.motion_state=='DRIVE') boti.motion_state = 'SLIDE';
        if (botj.motion_state=='DRIVE') botj.motion_state = 'SLIDE';
      }
    }
    shieldp.push(pi);
  }
  return collis;
};