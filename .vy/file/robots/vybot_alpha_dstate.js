const { surface_lock } = require('file::@@:Base:math/surface_lock.js');
exports.dstate = function(bot, delt, gravity, ground_kinetic_friction, surface_derivatives) {
  // Input x, y, yaw   -->  add z, roll, pitch
  if (bot.motion.state === 'FREEFALL') {  // Projectile motion
    bot.state.x += bot.motion.vx*delt;
    bot.state.y += bot.motion.vy*delt;
    bot.state.z += delt*(bot.motion.vz + gravity*delt);
    bot.motion.vz += gravity*delt;
  } else if (bot.motion.state === 'GROUNDCOLLISION') {
  } else { 
    if (bot.motion.state === 'DRIVE') {
      var vxy = bot.state.v*Math.cos(bot.state.pitch);
      bot.motion.vx = vxy*Math.cos(bot.state.yaw);  // dxdt
      bot.motion.vy = vxy*Math.sin(bot.state.yaw);  // dydt
      bot.state.x += bot.motion.vx*delt;         // global coordinates
      bot.state.y += bot.motion.vy*delt;         // global coordinates
    } else if (bot.motion.state === 'SLIDE') {
      bot.state.x += bot.motion.vx*delt;
      bot.state.y += bot.motion.vy*delt;
      var fdv = Math.abs(gravity*ground_kinetic_friction*delt);
      var v = Math.sqrt(bot.motion.vx*bot.motion.vx + bot.motion.vy*bot.motion.vy); 
      if (v <= fdv) {
        bot.motion.state = 'DRIVE';
      } else {
        bot.motion.vx *= (v-fdv)/v;
        bot.motion.vy *= (v-fdv)/v;
      }
    }
    
    var yaw = bot.state.yaw + bot.state.yawrate*delt;
    var xd = Math.cos(yaw);
    var yd = Math.sin(yaw);

    var zz = surface_derivatives(bot.state.x, bot.state.y, yaw); // {z:z,dzdx:dzdx,dzdy:dzdy};
    bot.state.z = zz.z;
    var out = surface_lock(bot.state.x,bot.state.y,xd,yd,bot.state.z,zz.dzdx,zz.dzdy); // return {roll:roll,pitch:pitch,yaw:yaw,dzdt:dzdt}
    bot.state.roll = out.roll;
    bot.state.yaw = out.yaw;
    bot.state.pitch = out.pitch;
    bot.motion.vz = out.dzdt;

    // Acceleration in direction of travel (i.e. along surface)
    var a = (bot.wheel_torque*bot.wheel_radius - 
      Math.sign(bot.state.v)*bot.drag_coefficient*bot.state.v*bot.state.v - 
      bot.state.pitch*bot.mass*gravity)/bot.mass;
    bot.state.v += a*delt;
    //bot.state.yawrate += 
  }
};