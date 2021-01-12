import { hsl_to_rgb } from '/vy/vybots/tools/hsl_to_rgb.js';
import { body_generator } from '/vy/vybots/robots/vybot_alpha.js';
import { botstate_init } from '/vy/vybots/robots/vybot_alpha_statev.js';

export function swarm(number_of_swarms, bots_per_swarm, arena_size, three_bodies, swarm) {
  let bot_specs = {
    track_width:0.3,
    wheel_base:0.6,
    height:0.1,
    density:10,
    wheel_radius:0.1,
    drag_coefficient:1,
    resistive_torque:0,
    wheel_torque: 0,
    desired_steer_angle:0,
    score:0
  };

  // Define the basis for each bot
  swarm.splice(0, swarm.length);
  let specs = JSON.parse(JSON.stringify(bot_specs));
  specs.motion_state = 'DRIVE';
  specs.inHomeBase = false;
  specs.inEnergySource = false;
  specs.hasOrb = false;
  specs.sensingRadius = 10;
  specs.mode = "retrieve";
  specs.velIntegral = 0;

  let cluster_radius = arena_size * 0.8;
  for (let ii=0; ii<number_of_swarms; ii++) {
    let hsl = [Math.floor((ii/number_of_swarms)*360), 100, 50];
    let rgb = hsl_to_rgb(hsl[0]/360, hsl[1]/100, hsl[2]/100);
    for (let jj=0; jj<bots_per_swarm; jj++) {
      let qb = (ii*bots_per_swarm + jj)/(bots_per_swarm*number_of_swarms)*2*Math.PI;
      let bot = JSON.parse(JSON.stringify(specs));
      bot.name = 'bot_'+ii+'_'+jj;
      bot.swarm_id = ii;
      bot.bot_id = jj;
      botstate_init(bot);
      bot.state.x = cluster_radius*Math.cos(qb);
      bot.state.y = cluster_radius*Math.sin(qb);
      bot.state.yaw = qb + Math.PI;
      body_generator(bot, three_bodies, rgb);
      swarm.push(bot);
    }
  }
};