// { collisions } = 
const { dstate } = require('file::@@:Base:robots/vybot_alpha_dstate.js');
const { collisions } = require('file::@@:Base:robots/vybot_alpha_collisions.js');

exports.dynamics = function(swarm, dt, xbody, surface_derivs) {
  let dofs = {};
  let gravity = -9.81
  let ground_kinetic_friction = 0.2;
  let coefficient_of_restitution = 0.8;
  swarm.forEach(function(bot) {
    dstate(bot, dt, gravity, ground_kinetic_friction, surface_derivs);
    dofs[bot.name+'_tx'] = bot.state.x;
    dofs[bot.name+'_ty'] = bot.state.y;
    dofs[bot.name+'_tz'] = bot.state.z;
    dofs[bot.name+'_rx'] = bot.state.roll;
    dofs[bot.name+'_ry'] = bot.state.pitch;
    dofs[bot.name+'_rz'] = bot.state.yaw;
  });
  collisions(swarm, coefficient_of_restitution, xbody);
  xbody.set_state(dofs);
};