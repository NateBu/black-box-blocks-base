(function(){
  let surface_lock = function(x,y,dxdt,dydt,z,dzdx,dzdy) {
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
    pitch = -Math.asin(nose[2]); //-Math.asin(R(3,1));
    cp = Math.cos(pitch);
    
    if (cp===0 && pitch > 0) {
        //a = R(1,2)/cp;
        //b = R(1,3)/cp;
        //roll = atan2(a,b);
        roll = Math.atan2(left[0],up[0])
        yaw = 0;
    } else if (cp===0 && pitch < 0) {
        //a = -R(1,2)/cp;
        //b = -R(1,3)/cp;
        //roll = atan2(a,b);
        roll = Math.atan2(-left[0],-up[0])
        yaw = 0;
    } else {
        // a = R(3,2)/cp;
        // b = R(3,3)/cp;
        roll = Math.atan2(left[2],up[2]); // atan2(a,b)
        //a = R(2,1)/cp;
        //b = R(1,1)/cp;
        yaw = Math.atan2(nose[1],nose[0]); //atan2(a,b);
    }
    return {roll:roll,pitch:pitch,yaw:yaw,dzdt:dzdt}
}
  return {surface_lock:surface_lock};
})();


//function R=Rz(x); R=[[cos(x),-sin(x),0];[sin(x),cos(x),0];[0,0,1]];
//function R=Rx(x); R=[[1,0,0];[0,cos(x),-sin(x)];[0,sin(x),cos(x)]];
//function R=Ry(x); R=[[cos(x),0,sin(x)];[0,1,0];[-sin(x),0,cos(x)]];