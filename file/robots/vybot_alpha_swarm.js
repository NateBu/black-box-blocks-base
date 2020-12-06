import { hsl_to_rgb } from '/vy/vybots/tools/hsl_to_rgb.js';
import { body_generator } from '/vy/vybots/robots/vybot_alpha.js';
import { botstate_init } from '/vy/vybots/robots/vybot_alpha_statev.js';

export function swarm(number_of_swarms, bots_per_swarm, arena_size, three_bodies, swarm) {
  var bot_specs = {
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
  var specs = JSON.parse(JSON.stringify(bot_specs));
  specs.motion_state = 'DRIVE';
  specs.inHomeBase = false;
  specs.inEnergySource = false;
  specs.hasOrb = false;
  specs.sensingRadius = 10;
  specs.mode = "retrieve";
  specs.velIntegral = 0;

  var inter_cluster_distance = arena_size / 20;
  var smallradius = inter_cluster_distance / 4;
  
  for (var ii=0; ii<number_of_swarms; ii++) {
    var qc = ii/number_of_swarms*2*Math.PI;
    var xc = Math.cos(qc);
    var yc = Math.sin(qc);
    var zc = 0; //this.waves.surface_derivatives(xc,yc,0);
    var hsl = [Math.floor((ii/number_of_swarms)*360),100,50];
    var rgb = hsl_to_rgb(hsl[0]/360,hsl[1]/100,hsl[2]/100);
    // output.swarmspecs.push({
    //   'color':'hsl('+hsl[0]+','+hsl[1]+'%,'+hsl[2]+'%)',
    //   'base':{x:xc,y:yc,z:zc.z,radius:5}
    // });
    for (var jj=0; jj<bots_per_swarm; jj++) {
      var qb = qc + Math.PI + jj/bots_per_swarm*2*Math.PI;
      var xb = Math.cos(qb);
      var yb = Math.sin(qb);
      var bot = JSON.parse(JSON.stringify(specs));
      bot.name = 'bot_'+ii+'_'+jj;
      bot.bot_id = ii*bots_per_swarm+jj;
      bot.swarm_id = ii;
      botstate_init(bot);
      bot.state.x = inter_cluster_distance*xc+smallradius*xb;
      bot.state.y = inter_cluster_distance*yc+smallradius*yb;
      body_generator(bot, three_bodies, rgb);
      swarm.push(bot);
    }
  }
  // three_bodies.origin = {mode:'watch', 'type':'xview', xbody:'ground',
  //   eye:[0,-arena_size/2,arena_size/5], center:[0,0,0], up:[0,0,1]
  // };
};