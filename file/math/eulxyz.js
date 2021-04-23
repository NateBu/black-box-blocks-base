export function R2xyz(R) {
  // This doesn't do any preprocessing of R, R should be a right-handed transformation matrix
  // in order for this routine to return reasonable results
  let xyz = {};
  xyz.pitch = Math.asin(-R[2][0]); // between -pi/2 and pi/2  
  xyz.roll = Math.atan2(R[2][1], R[2][2]);
  xyz.yaw = Math.atan2(R[1][0], R[0][0]);
  return xyz;
}

export function xyz2R(xyz) {
  var cx = Math.cos(xyz.roll),  sx = Math.sin(xyz.roll);
  var cy = Math.cos(xyz.pitch), sy = Math.sin(xyz.pitch);
  var cz = Math.cos(xyz.yaw),   sz = Math.sin(xyz.yaw);
  return [[cz*cy, cz*sy*sx-sz*cx, cz*sy*cx+sz*sx],
          [sz*cy, sz*sy*sx+cz*cx, sz*sy*cx-cz*sx],
          [-sy,          cy*sx,          cy*cx]];
};

export function mtranspose(R) {
    return [[R[0][0], R[1][0], R[2][0]],
            [R[0][1], R[1][1], R[2][1]],
            [R[0][2], R[1][2], R[2][2]]];
}

export function mmult(R,v) {
    return R.map(w => v[0]*w[0] + v[1]*w[1] + v[2]*w[2]);
}