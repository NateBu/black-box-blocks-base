console.clear();
import { three } from "/vy/vybots/vythree.js"
import { environment } from '/vy/vybots/robots/environment.js';
import { surface_derivatives } from '/vy/vybots/math/sine_surface.js';
import { teleop_setup } from '/vy/vybots/robots/vybot_teleop.js';
import { xbodyf } from '/vy/vybots/robots/xbody.js';
import { swarm } from '/vy/vybots/robots/vybot_alpha_swarm.js';
import { dynamics } from '/vy/vybots/robots/vybot_alpha_dynamics.js';
let simcontrols = {RUNNING:false};
let DT = 0.05;  // INTEGRATION INTERVAL
let THREEDIV = document.querySelector('div.vybotworld');

// Initialize threejs
three.init(THREEDIV);

// Set number of swarms and bots per swarm
let number_of_swarms = 4;
let bots_per_swarm = 2;

// Build the ground with it's surface derivatives
let arena_size = 50;
let amplitude = 3;
let ground = environment(three, arena_size, amplitude);  

let surface_derivs = function(x, y, yaw) {
  return surface_derivatives(x, y, yaw, ground.waves);
};

let THREE_BODIES = {};
let SWARM = [];
let XBODY = xbodyf(three);

var editor = ace.edit("editor");
editor.setTheme("ace/theme/twilight");
editor.session.setMode("ace/mode/javascript");
editor.setFontSize(20);
editor.setValue('// bot_command("FORWARD");\n// bot_command("BACK");\n// bot_command("LEFT");\n// bot_command("RIGHT");\nkeydownfunc = function(e, bot_command) {\n  console.log("HI!");\n}\n');

let INIT = function() {
  swarm(number_of_swarms, bots_per_swarm, arena_size, THREE_BODIES, SWARM);
  XBODY.init(THREE_BODIES); //degree_of_freedom_order
  let code = editor.getValue();
  try {
    let keydownfunc = null; //function() {}
    //eval(code);
    teleop_setup(XBODY, simcontrols, SWARM, keydownfunc);
  } catch(err) {
    console.log('Code failed to load: '+err);
  }
}
INIT();
THREEDIV.addEventListener("dblclick", INIT, false); 

setInterval(function() {
  if (!simcontrols.RUNNING) return;
  
  let botitem = `bot_0_0_chassis`;
  let eye = XBODY.l2g(new THREE.Vector3( -1, 0, 0.6 ),botitem);
  let lookat = XBODY.l2g(new THREE.Vector3( 1, 0, 0.5 ),botitem);
  let up = XBODY.v2g(new THREE.Vector3( 0, 0, 1 ),'ground');
  XBODY.three.camera.position.set(eye.x,eye.y,eye.z);
  XBODY.three.camera.lookAt(lookat);
  XBODY.three.camera.up.set(up.x,up.y,up.z);

  
  let rslts = {};
  let N = 1;
  for (var ii = 0; ii < N; ii++) {
    rslts = dynamics(SWARM, DT/N, XBODY, surface_derivs, arena_size);
  }
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
