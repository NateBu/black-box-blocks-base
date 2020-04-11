exports.controller = function(bot,goalx,goaly) {
  let dx = goalx - bot.state.x, dy = goaly - bot.state.y;
  let dq = ((Math.atan2(dy,dx) - bot.state.yaw + Math.PI) % (2*Math.PI)) - Math.PI;
  let dl = Math.sqrt(dx*dx + dy*dy);
  let Tff = -(Math.sin(bot.state.pitch)*9.81*bot.mass)*bot.wheel_radius;
  bot.wheel_torque = Tff;
  bot.desired_steer_angle = 0;
  if (dl > 0.1) {
    let cq = Math.cos(bot.state.yaw);
    let sq = Math.sin(bot.state.yaw);
    let v = bot.state.vx*cq + bot.state.vy*sq;
    bot.wheel_torque += Math.min(2,Math.max(-2,(dl - v)));
    bot.desired_steer_angle = dq/3;
  }
};