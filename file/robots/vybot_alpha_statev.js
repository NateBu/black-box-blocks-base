Math.wrap = function(q) {
  let dq = ((q+Math.PI) % (2*Math.PI)) - Math.PI;
  if (dq > Math.PI) {
    dq -= Math.PI*2;
  } else if (dq < Math.PI) {
    dq += Math.PI*2;
  }
  return dq;
}

export function botstate_to_vec(bot) {
  return [bot.state.x, bot.state.y, bot.state.z, 
    bot.state.roll, bot.state.pitch, bot.state.yaw,
    bot.state.steer_angle, 
    bot.state.vx, bot.state.vy, bot.state.vz,
    bot.state.rollrate, bot.state.pitchrate, bot.state.yawrate,
    bot.state.steer_rate];
};

export function vec_to_botstate(xn,bot) {
  bot.state.x = xn[0];
  bot.state.y = xn[1];
  bot.state.z = xn[2];
  bot.state.roll = xn[3];
  bot.state.pitch = xn[4];
  bot.state.yaw = xn[5];
  bot.state.steer_angle = xn[6];
  bot.state.vx = xn[7];
  bot.state.vy = xn[8];
  bot.state.vz = xn[9];
  bot.state.rollrate = xn[10];
  bot.state.pitchrate = xn[11];
  bot.state.yawrate = xn[12];
  bot.state.steer_rate = xn[13];
  if (Math.abs(bot.state.steer_angle) + Math.abs(bot.state.steer_rate) < 0.01) {
    bot.state.yawrate = 0;
    // if (Math.abs(bot.state.vy) > 0.1 || Math.abs(bot.state.vx) > 0.1) {
    //   let dq = Math.wrap(Math.atan2(bot.state.vy, bot.state.vx) - bot.state.yaw);
    //   if (Math.abs(dq) < Math.PI/2) { dq += Math.PI };
    //   bot.state.yaw += dq;
    // }
  }

};

export function botstate_init(bot) {
  let xn = [0,0,0,  0,0,0,  0,0,0,  0,0,0,  0,0];
  bot.state = {};
  vec_to_botstate(xn,bot);
};