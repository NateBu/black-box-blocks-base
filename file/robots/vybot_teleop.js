import { VY } from '/vybase/VY.js';

export function teleop_setup(three, simcontrols, vybot) {
  
  let controldiv = document.createElement('div');
  controldiv.setAttribute('style',`position:absolute;background-color:darkgray;bottom:10px;left:calc(50% - 150px);height:40px;width:300px;padding:0px;border-radius:5px;margin: 0 auto;`);
  controldiv.setAttribute('tabindex',"0");
  document.body.appendChild(controldiv);

  const MAX_TORQUE = 200;
  const MIN_TORQUE = -200;
  const MAX_STEER_ANGLE = 0.55;
  const MIN_STEER_ANGLE = -0.55;
  const TORQUE_STEP = (MAX_TORQUE - MIN_TORQUE)/40;
  const STEER_STEP = (MAX_STEER_ANGLE - MIN_STEER_ANGLE)/20;
  const RESISTIVE_STEP = 1/40;
  let COMMAND = {steer:'NONE',throttle:'NONE'};
  setInterval(function() {
    if (!simcontrols.RUNNING) return;
    let dst = 0, dto = 0, dre = -RESISTIVE_STEP;
    if (COMMAND.steer == 'NONE') {
      let curst = vybot.desired_steer_angle;
      let dst = Math.min(4*STEER_STEP,Math.abs(curst));
      vybot.desired_steer_angle = curst + ((curst > 0) ? -dst : dst);
    } else if (COMMAND.steer == 'LEFT') {     vybot.desired_steer_angle += STEER_STEP;      
    } else if (COMMAND.steer == 'RIGHT') {    vybot.desired_steer_angle -= STEER_STEP; }
    if (COMMAND.throttle == 'FORWARD') {      vybot.wheel_torque += TORQUE_STEP;
    } else if (COMMAND.throttle == 'BACK') {  vybot.wheel_torque -= TORQUE_STEP; }
    vybot.desired_steer_angle = Math.max(MIN_STEER_ANGLE,Math.min(MAX_STEER_ANGLE,vybot.desired_steer_angle));
    // vybot.resistive_torque = (COMMAND.throttle == 'NONE') ? 
    //   Math.min(1,vybot.resistive_torque + RESISTIVE_STEP) :
    //   Math.max(0,vybot.resistive_torque - RESISTIVE_STEP);
    vybot.wheel_torque = Math.max(MIN_TORQUE,Math.min(MAX_TORQUE,vybot.wheel_torque));
    let gage = ` T:${vybot.wheel_torque.toFixed(0)} S:${vybot.desired_steer_angle.toFixed(2)} `;
    controldiv.innerHTML = `<center style="width: calc(100% - 20px);padding:10px">${gage}</center>`;
    // VY.log.write(COMMAND, vybot.wheel_torque, vybot.resistive_torque, vybot.desired_steer_angle)
  },50);
  const add_run_text = function() {
    controldiv.innerHTML = '<center style="width: calc(100% - 20px);padding:10px">Click to Start</center>';
  }

  const run = function() {
    simcontrols.RUNNING = !simcontrols.RUNNING;
    three.INACTIVE = !simcontrols.RUNNING;
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
    if (e.keyCode === 37 || e.keyCode === 39) { COMMAND.steer = 'NONE';    // Left
    } else if (e.keyCode === 38 || e.keyCode === 40) { COMMAND.throttle = 'NONE'; // Forward
    }
  });

  controldiv.addEventListener("keydown", function(e){
    e.stopPropagation();
    e.preventDefault();
    if (e.keyCode === 32)        { run();               // spacebar
    } else if (e.keyCode === 37) { COMMAND.steer = 'LEFT';    // Left
    } else if (e.keyCode === 39) { COMMAND.steer = 'RIGHT';   // Right
    } else if (e.keyCode === 38) { COMMAND.throttle = 'FORWARD'; // Forward
    } else if (e.keyCode === 40) { COMMAND.throttle = 'BACK';    // Back
    }
    // VY.log.write(`Torque = ${vybot.wheel_torque}, SteerAngle = ${vybot.desired_steer_angle}`)
  },false); 

  
}