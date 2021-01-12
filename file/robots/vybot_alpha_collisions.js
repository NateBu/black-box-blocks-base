export function collisions(swarm, xbody, coefficient_of_restitution, outer_radius) {
  let shieldp = [];
  let collis = [];
  for (let ii in swarm) {
    let boti = swarm[ii];
    let com = boti.shield;
    let pi = xbody.l2g(new THREE.Vector3(com.x,com.y,com.z), boti.chassis_name);
    if (outer_radius) {
      let sr_ = outer_radius - boti.shield.radius;
      if (pi.x*pi.x + pi.y*pi.y - sr_*sr_ > 0) {
        let q = Math.atan2(pi.y,pi.x), dx = Math.cos(q), dy = Math.sin(q);
        // velocity perpendicular to collision before collision
        let vperp = boti.state.vx*dx + boti.state.vy*dy;
        if (vperp > 0) {
          let f = Math.min(1, Math.max(0, coefficient_of_restitution));
          boti.state.vx -= vperp*(1+f)*dx;
          boti.state.vy -= vperp*(1+f)*dy;
          if (boti.motion_state=='DRIVE') boti.motion_state = 'SLIDE';  
        }
      }
    }
    for (let jj in shieldp) {
      let botj = swarm[jj];
      let pj = shieldp[jj];
      let dx = pi.x-pj.x;
      let dy = pi.y-pj.y;
      let dz = pi.z-pj.z;
      let dmag = Math.sqrt(dx*dx + dy*dy + dz*dz);
      let doverlap = (boti.shield.radius+botj.shield.radius) - dmag;
      if (doverlap > 0) {
        dx = dx/dmag; dy = dy/dmag; dz = dz/dmag;
        boti.state.x += dx*doverlap/2;
        boti.state.y += dy*doverlap/2;
        botj.state.x -= dx*doverlap/2;
        botj.state.y -= dy*doverlap/2;
        collis.push({ii:ii,jj:jj,dx:dx,dy:dy,dz:dz});
        let mi = boti.mass;
        let mj = botj.mass;
        // velocities perpendicular to collision before collision
        let viperp = boti.state.vx*dx+boti.state.vy*dy+boti.state.vz*dz;
        let vjperp = botj.state.vx*dx+botj.state.vy*dy+botj.state.vz*dz;
        if (viperp > 0 && vjperp < 0) continue; // Already moving away from each other
        let p = viperp*mi+vjperp*mj; // Momentum in direction of collision
        let f = Math.sqrt(Math.min(1,Math.max(0, coefficient_of_restitution)))/(mi+mj);
        let vi = f*(viperp*(mi-mj)+2*mj*vjperp);
        let vj = f*(vjperp*(mj-mi)+2*mi*viperp);
        
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