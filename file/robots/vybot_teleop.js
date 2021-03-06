import { VY } from '/vybase/VY.js';

const MAX_TORQUE = 2;
const MIN_TORQUE = 0;
const MAX_STEER_ANGLE = 0.55;
const MIN_STEER_ANGLE = -0.55;
const TORQUE_STEP = (MAX_TORQUE - MIN_TORQUE)/40;
const STEER_STEP = (MAX_STEER_ANGLE - MIN_STEER_ANGLE)/20;
let COMMAND = {steer:'NONE',throttle:'NONE',botindex:0};

const bot_command = function(c) { 
  if (c=='RIGHT' || c=='LEFT')        { COMMAND.steer = c; }
  else if (c=='FORWARD' || c=='BACK')  { COMMAND.throttle = c; }
  // else if (c == 'RUN')                 { run(); }
  else if (['0','1','2','3','4','5','6','7','8','9'].indexOf(c) > -1) {
    COMMAND.botindex = parseInt(c);
  }
}

export function teleop_setup(XBODY, simcontrols, vybots, keydownfunc, commandf) {
  let el = document.querySelector('.vybotcontrols');
  if (el) el.parentNode.removeChild(el);

  let controldiv = document.createElement('div');
  controldiv.classList.add('.vybotcontrols');
  controldiv.setAttribute('style',`position:absolute;background-color:darkgray;bottom:10px;left:calc(50% - 150px);height:40px;width:300px;padding:0px;border-radius:5px;margin: 0 auto;`);
  controldiv.setAttribute('tabindex',"0");
  document.body.appendChild(controldiv);

  setInterval(function() {
    if (!simcontrols.RUNNING) return;

    let swarmid = 0;
    let botid = COMMAND.botindex % vybots.length;
    let vybot = vybots[botid];
    if (COMMAND.steer == 'NONE') {
      let curst = vybot.desired_steer_angle;
      let dst = Math.min(4*STEER_STEP,Math.abs(curst));
      vybot.desired_steer_angle = curst + ((curst > 0) ? -dst : dst);
    } else if (COMMAND.steer == 'LEFT') {     vybot.desired_steer_angle += STEER_STEP;      
    } else if (COMMAND.steer == 'RIGHT') {    vybot.desired_steer_angle -= STEER_STEP; }
    if (COMMAND.throttle == 'FORWARD') {      vybot.wheel_torque += TORQUE_STEP;  vybot.resistive_torque = 0;
    } else if (COMMAND.throttle == 'BACK') {  vybot.wheel_torque -= TORQUE_STEP;  vybot.resistive_torque += TORQUE_STEP;}
    vybot.desired_steer_angle = Math.max(MIN_STEER_ANGLE,Math.min(MAX_STEER_ANGLE,vybot.desired_steer_angle));
    vybot.resistive_torque = Math.max(0, Math.min(MAX_TORQUE,vybot.resistive_torque));
    vybot.wheel_torque = Math.max(MIN_TORQUE,Math.min(MAX_TORQUE,vybot.wheel_torque));
    let gage = `${botid}|${swarmid}| T:${vybot.wheel_torque.toFixed(2)} S:${vybot.desired_steer_angle.toFixed(2)} `;
    controldiv.innerHTML = `<center style="width: calc(100% - 20px);padding:10px">${gage}</center>`;
    // VY.log.write(COMMAND, vybot.wheel_torque, vybot.resistive_torque, vybot.desired_steer_angle)
  },50);
  const add_run_text = function() {
    controldiv.innerHTML = '<center style="width: calc(100% - 20px);padding:10px">Click to Start</center>';
  }

  const run = function() {
    simcontrols.RUNNING = !simcontrols.RUNNING;
    XBODY.three.ORBITCONTROLS = !simcontrols.RUNNING;
    XBODY.three.INACTIVE = !simcontrols.RUNNING;
    add_run_text();
    VY.log.clear();
    VY.log.write('Spacebar = Pause Simulation');
    VY.log.write('Up Button = Torque Forward');
    VY.log.write('Down Button = Torque Backward');
    VY.log.write('Left Button = Steer Left');
    VY.log.write('Right Button = Steer Right');
  };
  controldiv.addEventListener("click", run);
  add_run_text();
  controldiv.addEventListener("keyup", function(e){
    e.stopPropagation();
    e.preventDefault();
    COMMAND.steer = 'NONE'
    COMMAND.throttle = 'NONE'
    // if (e.keyCode === 37 || e.keyCode === 39) { COMMAND.steer = 'NONE';    // Left
    // } else if (e.keyCode === 38 || e.keyCode === 40) { COMMAND.throttle = 'NONE'; // Forward
    // }
  });

  controldiv.addEventListener("keydown", function(e){
    // e.stopPropagation();
    // e.preventDefault();
    if (keydownfunc) {
      keydownfunc(e, bot_command);
    } else {
      let keyint = parseInt(e.key);
      if (e.key === ' ')                { run(); }                 // spacebar
      else if (!isNaN(keyint))          { bot_command(e.key); }

      if (!simcontrols.RUNNING) return;
      if (e.key === 'ArrowLeft')   { bot_command('LEFT'); }   // Left
      else if (e.key === 'ArrowRight')  { bot_command('RIGHT'); }  // Right
      else if (e.key === 'ArrowUp')     { bot_command('FORWARD'); }// Forward
      else if (e.key === 'ArrowDown')   { bot_command('BACK'); }   // Back
    }
  },false); 

  
}