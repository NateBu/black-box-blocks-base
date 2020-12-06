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
};

export function botstate_init(bot) {
  let xn = [0,0,0,  0,0,0,  0,0,0,  0,0,0,  0,0];
  bot.state = {};
  vec_to_botstate(xn,bot);
};