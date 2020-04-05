vy.log.clear();
console.clear();
const { three } = require('file::@@:Base:vythree.js');
const { environment } = require('file::@@:Base:robots/environment.js');
const { sine_surface, surface_derivatives } = require('file::@@:Base:math/sine_surface.js');

let THREEDIV = document.createElement('div');
THREEDIV.setAttribute('style',`position:absolute;margin:0px;height:100%;width:100%;padding:0px;overflow:hidden`);
document.body.style.margin = '0px';
document.body.style.padding = '0px';
document.body.style.overflow = 'hidden';
document.body.appendChild(THREEDIV);

const setup = function() {
  if (window.innerWidth === 0 || !three.ready) {
    setTimeout(setup,1000); 
    return;
  }
  three.init(THREEDIV);
  const { xbodyf } = require('file::@@:Base:robots/xbody.js');
  const { swarm } = require('file::@@:Base:robots/vybot_alpha_swarm.js');
  const { dynamics } = require('file::@@:Base:robots/vybot_alpha_dynamics.js');
  let number_of_swarms = 5;
  let bots_per_swarm = 6;
  let arena_size = 100;
  let dt = 0.03;
  let ground = sine_surface("excellent", arena_size, 3, 200);
  environment(three, ground.geometry);
  
  let output = swarm(number_of_swarms, bots_per_swarm, arena_size);
  let xbody = xbodyf(three);
  let surface_derivs = function(x, y, yaw) {
    return surface_derivatives(x, y, yaw, ground.waves);
  };
  let dofs = {};
  
  
  xbody.init(output.threebodies); //degree_of_freedom_order
  // setInterval(function() {
    dynamics(output.swarm, dt, xbody, surface_derivs);
    let eye = xbody.l2g(new THREE.Vector3( -1, 0, 0.6 ),'bot_0_1_chassis');
    let lookat = xbody.l2g(new THREE.Vector3( 1, 0, 0.5 ),'bot_0_1_chassis');
    let up = xbody.v2g(new THREE.Vector3( 0, 0, 1 ),'bot_0_1_chassis');
    xbody.three.camera.position.set(eye.x,eye.y,eye.z);
    xbody.three.camera.lookAt(lookat);
    xbody.three.camera.up.set(up.x,up.y,up.z);
  // },50);

};
setup();