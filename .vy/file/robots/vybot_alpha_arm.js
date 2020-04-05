exports.arm_generator = function(collection, namebase, parent, wheel_base, wheel_radius, rgb) {
  let lengths = [
    {l:wheel_base*0.25, a:-1.2},
    {l:wheel_base*0.25, a:-1.3},
    {l:wheel_base*0.25, a:0.7}
  ];
  let d = 0;
  let x = wheel_base/4;
  let radius = wheel_radius/10;
  for (var ii=0; ii<lengths.length; ii++) {
    let name = namebase+`arm_${ii}`;
    let l = lengths[ii].l;
    collection[name] = {type:'xbody', name:name, parent:parent, rxyz:[0,0,0], txyz:[x,0,d],
      dof:[{'name':name+'_ry','axis':[0,1,0],'rotation':true,'position':lengths[ii].a}],
      shape:[{
        txyz:[0,0,l/2],
        rxyz:[1.57,0,0],
        name:name+'_cylinder',
        geometry:{
          type:'CylinderGeometry',
          arguments:[radius, radius, l, 20]
        },
        material:{
          type:'MeshStandardMaterial',
          arguments:[{depthTest:true, depthWrite:true, color:rgb, emissive:rgb}]
        }
      }]
    };
    parent = name;
    d = l;
    x = 0;
  }
};

// exports.arm_constraint = function(arm, xbody, cx, cy, radius) {
//   let maxa = 0.1; // Max angle change
//   const dqmaxf = function(dq) {
//     return Math.min.apply(null, dq.map(dqq => Math.abs(dqq)));
//   }
//   const normf = function(dq,scl) {
//     dq.forEach(dqq => dqq*scl);
//   }
//   let lastarm = arm.sk[arm.sk.length-1];
//   for (var jj = 0; jj < 20; jj++) {
//       // de = [cx;cy] - lastarm.endpoint;
//       nde = norm(de);
//       dir = nde - radius;
//       de = de/nde*dir;
//       if (Math.abs(dir) < 1e-2) {
//           break;
//       } else {
//           dq = pinv(lastarm.dendpointdq)*de;
//       }
//       let dqmax = dqmaxf(dq);
//       if (dqmax > maxa) normf(dq,maxa/dqmax);
//       let dof = {};
//       for (var ii = 0; ii < dq.length; ii++) {
//           dof[name] = dofname + dq[ii];
//       }
//       // dynamics(arm,0);
//   }
// }