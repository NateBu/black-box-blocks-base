exports.collisions = function(swarm, coefficient_of_restitution, xbody) {
  var shieldp = [];
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
      dx = dx/dmag; dy = dy/dmag; dz = dz/dmag;
      if (dmag < (boti.shield.radius+botj.shield.radius)) {
        var mi = boti.mass;
        var mj = botj.mass;
        // velocities perpendicular to collision before collision
        var viperp = boti.motion.vx*dx+boti.motion.vy*dy+boti.motion.vz*dz;
        var vjperp = botj.motion.vx*dx+botj.motion.vy*dy+botj.motion.vz*dz;
        if (viperp > 0 && vjperp < 0) continue; // Already moving away from each other
        var p = viperp*mi+vjperp*mj; // Momentum in direction of collision
        var f = Math.sqrt(Math.min(1,Math.max(0, coefficient_of_restitution)))/(mi+mj);
        var vi = f*(viperp*(mi-mj)+2*mj*vjperp);
        var vj = f*(vjperp*(mj-mi)+2*mi*viperp);
        
        boti.motion.vx -= dx*(viperp-vi);
        boti.motion.vy -= dy*(viperp-vi);
        boti.motion.vz -= dz*(viperp-vi);
        botj.motion.vx -= dx*(vjperp-vj);
        botj.motion.vy -= dy*(vjperp-vj);
        botj.motion.vz -= dz*(vjperp-vj);
        boti.state.v = 0;
        botj.state.v = 0;
        if (boti.motion.state=='DRIVE') boti.motion.state = 'SLIDE';
        if (botj.motion.state=='DRIVE') botj.motion.state = 'SLIDE';
      }
    }
    shieldp.push(pi);
  }
};