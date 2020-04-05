exports.swarm = function(number_of_swarms, bots_per_swarm, arena_size) {
  const { hsl_to_rgb } = require('file::@@:Base:ui/hsl_to_rgb.js');
  const { body_generator } = require('file::@@:Base:robots/vybot_alpha.js');
  let output = {
    swarmspecs:[],
    threebodies:{},
    swarm:[]
  }
  var bot_specs = {
    track_width:0.3,
    wheel_base:0.6,
    height:0.1,
    density:10,
    wheel_radius:0.1,
    drag_coefficient:1
  }

  // Define the basis for each bot
  var specs = JSON.parse(JSON.stringify(bot_specs));
  specs.wheel_torque = 40;
  specs.motion = {state:'DRIVE',vx:0,vy:0,vz:0};
  specs.inHomeBase = false;
  specs.inEnergySource = false;
  specs.hasOrb = false;
  specs.sensingRadius = 10;
  specs.mode = "retrieve";
  specs.velIntegral = 0;

  var inter_cluster_distance = arena_size / 20;
  var smallradius = inter_cluster_distance / 4;
  // vy.x3.set_dimensions(-arena_size, arena_size, -arena_size, arena_size);
  
  var degree_of_freedom_order = [];
  for (var ii=0; ii<number_of_swarms; ii++) {
    var qc = ii/number_of_swarms*2*Math.PI;
    var xc = Math.cos(qc);
    var yc = Math.sin(qc);
    var zc = 0; //this.waves.surface_derivatives(xc,yc,0);
    var hsl = [Math.floor((ii/number_of_swarms)*360),100,50];
    var rgb = hsl_to_rgb(hsl[0]/360,hsl[1]/100,hsl[2]/100);
    output.swarmspecs.push({
      'color':'hsl('+hsl[0]+','+hsl[1]+'%,'+hsl[2]+'%)',
      'base':{x:xc,y:yc,z:zc.z,radius:5}
    });
    for (var jj=0; jj<bots_per_swarm; jj++) {
      var qb = qc + Math.PI + jj/bots_per_swarm*2*Math.PI;
      var xb = Math.cos(qb);
      var yb = Math.sin(qb);
      var bot = JSON.parse(JSON.stringify(specs));
      bot.name = 'bot_'+ii+'_'+jj;
      bot.bot_id = ii*bots_per_swarm+jj;
      bot.swarm_id = ii;
      bot.state = {x:(inter_cluster_distance*xc+smallradius*xb),
          y:(inter_cluster_distance*yc+smallradius*yb),z:0,roll:0,pitch:0,yaw:qb,v:1,yawrate:0};
      // this.dstate(bot);
      var dofo = body_generator(bot, output.threebodies, rgb);
      degree_of_freedom_order = degree_of_freedom_order.concat(dofo);
      output.swarm.push(bot);
    }
  }
  
  output.threebodies.origin = {mode:'watch', 'type':'xview', xbody:'ground',
    eye:[0,-arena_size/2,arena_size/5], center:[0,0,0], up:[0,0,1]
  };
  return output;
};