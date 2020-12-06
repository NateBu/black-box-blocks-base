console.clear();

import { three } from "/vy/vybots/vythree.js"
import { environment } from '/vy/vybots/robots/environment.js';
import { sine_surface, surface_derivatives } from '/vy/vybots/math/sine_surface.js';
import { teleop_setup } from '/vy/vybots/robots/vybot_teleop.js';
import { xbodyf } from '/vy/vybots/robots/xbody.js';
import { swarm } from '/vy/vybots/robots/vybot_alpha_swarm.js';
import { dynamics } from '/vy/vybots/robots/vybot_alpha_dynamics.js';
let simcontrols = {RUNNING:false};
let DT = 0.05;
let THREEDIV = document.querySelector('div.vybotworld');

const setup = function() {
  if (window.innerWidth === 0 || !three.ready) {
    setTimeout(setup,1000); 
    return;
  }
  three.init(THREEDIV);
  let number_of_swarms = 5;
  let bots_per_swarm = 4;
  let arena_size = 100;
  let amplitude = 3;
  let ground = sine_surface("excellent", arena_size, amplitude, 200);
  environment(three, ground.geometry);
  
  let THREE_BODIES = {};
  let SWARM = [];

  let xbody = xbodyf(three);
  let surface_derivs = function(x, y, yaw) {
    return surface_derivatives(x, y, yaw, ground.waves);
  };
  let dofs = {};
  
  let INIT = function() {
    swarm(number_of_swarms, bots_per_swarm, arena_size, THREE_BODIES, SWARM);
    xbody.init(THREE_BODIES); //degree_of_freedom_order
    teleop_setup(three, simcontrols, SWARM[0]);
  };
  INIT();
  THREEDIV.addEventListener("dblclick", INIT, false); 
  
  setInterval(function() {
    if (!simcontrols.RUNNING) return;
    let rslts = {};
    let N = 1;
    for (var ii = 0; ii < N; ii++) {
      rslts = dynamics(SWARM, DT/N, xbody, surface_derivs);
    }
    let eye = xbody.l2g(new THREE.Vector3( -1, 0, 0.6 ),'bot_0_0_chassis');
    let lookat = xbody.l2g(new THREE.Vector3( 1, 0, 0.5 ),'bot_0_0_chassis');
    let up = xbody.v2g(new THREE.Vector3( 0, 0, 1 ),'bot_0_0_chassis');
    xbody.three.camera.position.set(eye.x,eye.y,eye.z);
    xbody.three.camera.lookAt(lookat);
    xbody.three.camera.up.set(up.x,up.y,up.z);
    rslts.collisions.forEach(function(c) {
      let boti = SWARM[c.ii];
      let botj = SWARM[c.jj];
      let n = Math.sqrt(c.dx*c.dx + c.dy*c.dy);
      let dpi = -(Math.cos(boti.state.yaw)*c.dx + Math.sin(boti.state.yaw)*c.dy);
      let dpj =  (Math.cos(botj.state.yaw)*c.dx + Math.sin(botj.state.yaw)*c.dy);
      if (dpi > 0.8 && dpj > 0.8) {
        boti.score -= 2;
        botj.score -= 2;
      } else if (dpi > 0.8) {
        boti.score += 3;
        botj.score -= 2;
      } else if (dpj > 0.8) {
        botj.score += 3;
        boti.score -= 2;
      }
      // console.log(boti.swarm_id,boti.score,botj.swarm_id,botj.score)
    });

  },DT*1000);

};

setup();