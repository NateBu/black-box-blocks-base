R2xyz = function(R) {
  // This doesn't do any preprocessing of R, R should be a right-handed transformation matrix
  // in order for this routine to return reasonable results
  //sinsign = 1.d0
  //if (dot_product(R(:,3),nm_math_xp11(R(:,1),R(:,2))) < 0.d0) sinsign=-1.d0 ! Left handed matrix
  var tiny = 1e-12;
  var xyz = [0,0,0];
  var s2 = math.max(-1.0,math.min(1.0,R[0][2]));
  xyz[1] = math.asin(s2);
  var c2 = math.cos(xyz[1]);
  
  if (c2 === 0) {
      // Gimbal lock! indeterminate for eulers 1, 3
      //c1*s3 + s1*c3 = R(2,1);
      //s1*s3 - c1*c3 = R(3,1);
      //c1*c3 - s1*s3 = R(2,2);
      //s1*c3 + c1*s3 = R(3,2);
      // So just let eu(3)=0: s3 = 0, c3 = 1
      // s1 = R(2,1)
      // c1 = R(2,2)
      xyz[2] = 0;
      xyz[0] = math.atan2(R[1][0],R[1][1]);

  } else {
      c2 = 1/c2;
      var c1 = math.max(-1.0,math.min(1.0,R[2][2]))*c2;
      var s1 = math.max(-1.0,math.min(1.0,-R[1][2]))*c2;
      var c3 = math.max(-1.0,math.min(1.0,R[0][0]))*c2;
      var s3 = math.max(-1.0,math.min(1.0,-R[0][1]))*c2;
      var ta = (c1*s3 + c3*s1*s2 - R[1][0]);
      var tb = (s1*s3 - c1*c3*s2 - R[2][0]);
      var tc = (c1*c3 - s1*s2*s3 - R[1][1]);
      var td = (s1*c3 + c1*s2*s3 - R[2][1]);
      if ((math.abs(ta)+math.abs(tb)+math.abs(tc)+math.abs(td))/4.0 > tiny) {
          xyz[1] = math.pi-xyz[1];
          xyz[2] = math.atan2(-s3,-c3);
          xyz[0] = math.atan2(-s1,-c1);
      } else {
          xyz[2] = math.atan2(s3,c3);
          xyz[0] = math.atan2(s1,c1);
      }
  }
  return xyz;
};

xyz2R = function(xyz) {
  var cx = Math.cos(xyz[0]), sx = Math.sin(xyz[0]);
  var cy = Math.cos(xyz[1]), sy = Math.sin(xyz[1]);
  var cz = Math.cos(xyz[2]), sz = Math.sin(xyz[2]);
  return [
    [cy*cz,           -cy*sz,              sy],
    [sx*sy*cz+cx*sz,  -sx*sy*sz+cx*cz, -sx*cy],
    [-cx*sy*cz+sx*sz,  cx*sy*sz+sx*cz,  cx*cy]];
};