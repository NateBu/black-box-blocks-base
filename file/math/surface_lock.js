import { R2xyz, xyz2R, mtranspose, mmult } from '/vybots/math/eulxyz.js';

export function surface_lock(x,y,dxdt,dydt,z,dzdx,dzdy) {
  // Inputs:
  // x = x position of vehicle (m)
  // y = y position of vehicle (m)
  // dxdt = x velocity of vehicle (m/s)
  // dydt = y velocity of vehicle (m/s)
  // z = z position of vehicle (m/s)
  // dzdx = derivative of z position of surface with respect to x (dimensionless)
  // dzdy = derivative of z position of surface with respect to y (dimensionless)
  //
  // Outputs:
  // p = (x,y,z) position of vehicle (m)
  // q = [roll,pitch,yaw] (rad)
  var cross = function(a,b) {
    return [a[1]*b[2]-a[2]*b[1] , a[2]*b[0]-b[2]*a[0] , a[0]*b[1]-b[0]*a[1]]
  };
  
  var dzdt = dzdx*dxdt + dzdy*dydt;
  var dpdt = [dxdt,dydt,dzdt];
  
  var uphigh = [dzdx,dzdy,-1];
  var uplow = Math.sqrt(dzdx*dzdx+dzdy*dzdy+1);
  var up = [-uphigh[0]/uplow, -uphigh[1]/uplow, -uphigh[2]/uplow];
  var noselow = Math.sqrt(dxdt*dxdt+dydt*dydt+dzdt*dzdt);
  var nose = [dpdt[0]/noselow,dpdt[1]/noselow,dpdt[2]/noselow];
  var left = cross(up,nose);

  // Assuming that the transformation from local to global is
  // R = R_roll_x * R_pitch_y * R_yaw_z  (Global = R * Local)
  // up = R*[0,0,1]';     left = R*[0,1,0]';     nose = R*[1,0,0]'
  //   ... therefore: R = [nose,left,up]
  //R = [nose',left',up'];
  let xyz = R2xyz(mtranspose([nose,left,up]));
  xyz.dzdt = dzdt;
  return xyz;
};

//function R=Rz(x); R=[[cos(x),-sin(x),0];[sin(x),cos(x),0];[0,0,1]];
//function R=Rx(x); R=[[1,0,0];[0,cos(x),-sin(x)];[0,sin(x),cos(x)]];
//function R=Ry(x); R=[[cos(x),0,sin(x)];[0,1,0];[-sin(x),0,cos(x)]];