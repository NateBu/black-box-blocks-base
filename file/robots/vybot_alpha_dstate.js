import { surface_lock } from '/vy/vybots/math/surface_lock.js';
import { rk4 } from '/vy/vybots/math/rk.js';
import { botstate_to_vec, vec_to_botstate } from '/vy/vybots/robots/vybot_alpha_statev.js';

let derivs = function(t,x,params) {
  // x = [px,py,yaw,steer_angle,   vx,vy,yawrate,dsteer_angledt]
  let bot = params.bot;
  vec_to_botstate(x,bot);
  let cq = Math.cos(bot.state.yaw);
  let sq = Math.sin(bot.state.yaw);
  let vmag = Math.sqrt(bot.state.vx*bot.state.vx + bot.state.vy*bot.state.vy + 
                    bot.state.vz*bot.state.vz);
  let steer_acc_ = 0; //4*(bot.desired_steer_angle - bot.state.steer_angle) - 10*bot.state.steer_rate;
  bot.state.steer_rate = 5*(bot.desired_steer_angle - bot.state.steer_angle);
  let yaw_acc_ = 0, ax_ = 0, ay_ = 0, az_ = 0;
  if (bot.motion_state === 'FREEFALL') {  az_ = params.gravity;  // Projectile motion
  } else if (bot.motion_state === 'GROUNDCOLLISION') {
  } else if (bot.motion_state === 'DRIVE') {
    let vlong = cq*bot.state.vx + sq*bot.state.vy; // TODO INCLUDE Z;
    // bot.state.yawrate = Math.tan(bot.state.steer_angle)/bot.wheel_base*vlong;
    let Fgx = -Math.sin(bot.state.pitch)*bot.mass*params.gravity;
    let Faero = -bot.drag_coefficient*vmag*vlong;
    let Fprop = bot.wheel_torque/bot.wheel_radius;
    let acceleration = (Fprop + Faero + Fgx)/bot.mass;
    ax_ = acceleration*cq - sq*vlong*bot.state.yawrate;
    ay_ = acceleration*sq + cq*vlong*bot.state.yawrate;
    let sec = 1/Math.cos(bot.state.steer_angle);
    yaw_acc_ = (vlong*sec*sec*bot.state.steer_rate + 
      acceleration*Math.tan(bot.state.steer_angle))/bot.wheel_base;
  } else if (bot.motion_state === 'SLIDE') {
    var friction = Math.abs(params.gravity*params.ground_kinetic_friction); // TODO attitude adjust
    ax_ = -bot.state.vx/vmag*friction;
    ay_ = -bot.state.vy/vmag*friction;
    az_ = -bot.state.vz/vmag*friction;
    if (vmag <= 0.5) { // Slow enough to stop
      ax_ = 0; ay_ = 0; az_ = 0; bot.motion_state = 'DRIVE';
    }
  }
  return [bot.state.vx, bot.state.vy, bot.state.vz, 
    bot.state.rollrate, bot.state.pitchrate, bot.state.yawrate, bot.state.steer_rate, 
    ax_, ay_, az_,     0, 0, yaw_acc_,   steer_acc_];
};

export function dstate(bot, delt, gravity, ground_kinetic_friction, surface_derivatives) {
  // Input x, y, yaw   -->  add z, roll, pitch

  // Acceleration in direction of travel (i.e. along surface)
    // bot.state.v -= (bot.resistive_torque)*bot.state.v;
    // var vxy = bot.state.v*Math.cos(bot.state.pitch);
    // bot.state.vx = vxy*Math.cos(bot.state.yaw);  // dxdt
    // bot.state.vy = vxy*Math.sin(bot.state.yaw);  // dydt
  let y = botstate_to_vec(bot);
  let params = {bot:bot, gravity:gravity, ground_kinetic_friction:ground_kinetic_friction};
  y = rk4(0,y,delt,params,derivs);
  vec_to_botstate(y,bot);
  var zz = surface_derivatives(bot.state.x, bot.state.y, bot.state.yaw); // {z:z,dzdx:dzdx,dzdy:dzdy};
  bot.state.z = zz.z;
  var xd = Math.cos(bot.state.yaw);
  var yd = Math.sin(bot.state.yaw);
  var out = surface_lock(bot.state.x,bot.state.y,xd,yd,bot.state.z,zz.dzdx,zz.dzdy); // return {roll:roll,pitch:pitch,yaw:yaw,dzdt:dzdt}
  bot.state.roll = out.roll;
  bot.state.yaw = out.yaw;
  bot.state.pitch = out.pitch;
  bot.state.vz = out.dzdt;
};