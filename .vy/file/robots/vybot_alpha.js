const { box_inertia, ellipsoid_inertia } = require('file::@@:Base:math/simple_inertias.js');
const { arm_generator } = require('file::@@:Base:robots/vybot_alpha_arm.js');

var rgbToHex = function (rgb) { 
  var z = function(rgb) {
    var x = Math.min(255, Math.max(0, Math.floor(rgb*255+0.5)));
    var hex = Number(x).toString(16);
    return (hex.length < 2) ? "0" + hex : hex;
  }
  return parseInt("0x"+rgb.map(z).join(''));
};

var dof = function(dofp,name) {
  var sufx = ['_tx','_ty','_tz','_rz','_ry','_rx'];
  var axis = [[1,0,0],[0,1,0],[0,0,1],[0,0,1],[0,1,0],[1,0,0]];
  var ii = -1;
  return dofp.map(function(dofp_) {
    ii++;
    return {'name':name+sufx[ii],'axis':axis[ii],'rotation':ii>2,'position':dofp_};
  }).filter(function(dofp_) {
    return dofp_.position !== null;
  });
};

var body = function(origin,rotation,com,inertia,name,parent,renderi,rgb) {
  var x = {
    type:'xbody',
    name:name,
    parent:parent,
    rxyz:[rotation.x, rotation.y, rotation.z],
    txyz:[origin.x, origin.y, origin.z],
    dof:[],
    com:[com.x, com.y, com.z],
    mass:inertia.mass,
    inertia:[inertia.Ix, inertia.Iy, inertia.Iz, 0, 0, 0],
    renderinertia:renderi
  };
  return x;  
};

var boxpoly = function(origin,dimensions,name,parent,rgb,shieldr) {
  var mat = {depthTest:true, depthWrite:true, color:rgb, emissive:rgb};
  var shieldmat = JSON.parse(JSON.stringify(mat));
  shieldmat.transparent = true; shieldmat.opacity = 0.2;
  let dx = dimensions.x*0.5, dy = dimensions.y*0.5, dz = dimensions.z/4;
  let points = [
    {x: dx,  y:-dy},   {x: -dx,  y:-dy},
    {x: -dx, y:-dy/2}, {x: dx/2, y:-dy/2},
    {x: dx/2,y: dy/2}, {x: -dx,  y: dy/2},
    {x: -dx, y: dy},   {x: dx,   y: dy}
  ];
  var extrudeSettings = {
  	steps: 4,
  	depth: dz,
  	bevelEnabled: true,
  	bevelThickness: dz,
  	bevelSize: dz,
  	bevelOffset: 0,
  	bevelSegments: 3
  };
  
  return {
      type:'xbody',
      name:name,
      parent:parent,
      txyz:[origin.x,origin.y,origin.z],
      shape:[{
        name:name,
        geometry:{
          type:'Extrusion',
          arguments:[points,extrudeSettings]
        },
        material:{type:'MeshStandardMaterial',arguments:[mat]}
      },{
        name:name+'__shield',
        rxyz:[1.57,0,0],
        geometry:{
          type:'CylinderGeometry',
          arguments:[shieldr,shieldr,shieldr/8,24,2]
        },
        material:{type:'MeshStandardMaterial',arguments:[shieldmat]}
      }]
  };
};

exports.body_generator = function(specs,collection,rgbarray) {
  // specs has:
  //    track_width, wheel_base, height, density, origin, name, wheel_radius
  // specs gets the following added to it
  //    mass, Iz, chassis_name, state={x,y,z,roll,pitch,yaw}
  var rgb = rgbToHex(rgbarray);
  
  // Add chassis
  specs.mass = 0;
  var d = {x:specs.wheel_base, y:specs.track_width, z:specs.height};
  var com = {x:specs.wheel_base/2, y:0, z:specs.height/2+specs.wheel_radius};
  var inertia = box_inertia(d.x,d.y,d.z,specs.density);
  specs.mass += inertia.mass;
  specs.Iz = inertia.Iz;
  specs.chassis_name = specs.name+'_chassis';
  var xbody = body({x:0,y:0,z:0},{x:0,y:0,z:0},com,inertia,specs.chassis_name,'ground',false,rgb);
  xbody.dof = dof([specs.state.x,specs.state.y,specs.state.z,
    specs.state.yaw, specs.state.pitch, specs.state.roll], specs.name);
  xbody.alphabot = {};
  collection[xbody.name] = xbody; //collection.upsert(xbody);

  var dy = specs.track_width/2;
  var dx = specs.wheel_base/2+specs.wheel_radius;
  var shieldr = Math.sqrt(dy*dy+dx*dx);
  specs.shield = {radius:shieldr, x:com.x, y:com.y, z:com.z - specs.height/2};

  // Add wheels
  var zp = specs.wheel_radius;
  inertia = ellipsoid_inertia(specs.wheel_radius, specs.track_width/8,
    specs.wheel_radius, specs.density);
  for (var ii=0; ii<2; ii++) {
    var yp = (ii===0) ? -specs.track_width/2 : specs.track_width/2;
    var side = (ii===0) ? "Left" : "Right";
    for (var jj=0; jj<2; jj++) {
      var xp = (jj===0) ? 0 : specs.wheel_base;
      var foreaft = (jj===0) ? "Back" : "Front";
      var steer = (jj===0) ? null : 0;
      var name = specs.name+side+foreaft+'Wheel';
      specs.mass += inertia.mass;
      var wheel = body({x:xp,y:yp,z:zp},{x:0,y:0,z:0},{x:0,y:0,z:0},inertia,name,specs.chassis_name,false,rgb);
      wheel.dof = dof([null, null, null, steer, 0, null], name);
      wheel.shape = [{
        name:name+'_cylinder',
        geometry:{
          type:'CylinderGeometry',
          arguments:[specs.wheel_radius,specs.wheel_radius,specs.track_width/8,20]
        },
        material:{
          type:'MeshStandardMaterial',
          arguments:[{depthTest:true, depthWrite:true, color:rgb}]
        }
      }];
      collection[wheel.name] = wheel; //collection.upsert(wheel);
    }
  }
  
  // var ball_radius = .1;
  // var cannon_z_offset = 0.2;
  // var cannon_x_offset = 0.25;
  // // var origin_cannon_center = {x:cannon_x_offset, y:0, z:cannon_z_offset*2};
  // // inertia = ellipsoid_inertia(ball_radius,ball_radius,ball_radius,density);
  // // xbody = body(origin_cannon_center,{x:0,y:0,z:0},origin_cannon_center,inertia,specs.name+'_cannon_center',specs.chassis_name,false,[0.5,0.5,0.5,0]);
  // // collection.upsert(xbody);
  
  // var cannon_length = 0.5;
  // var origin_cannon = {x:0, y:0, z:specs.height+.2};
  // var com_cannon = {x:cannon_length/2, y:0, z:0.0};
  // var rotation_cannon = {x:0, y:-0.5, z:0};
  // inertia = ellipsoid_inertia(cannon_length/2,0.05,0.05,specs.density);
  // xbody = body(origin_cannon,rotation_cannon,com_cannon,inertia,specs.name+'_cannon',specs.chassis_name,true,[rgb[0],rgb[1],rgb[2],0]);
  // xbody.dof = dof([null, null, null, 0,0,0], specs.name+'_cannon');
  // collection.upsert(xbody);
  
  // var length2 = cannon_length;
  // // var origin_ball = {x:length2*Math.cos(rotation_cannon.y)+cannon_x_offset, y:0, z:-length2*Math.sin(rotation_cannon.y)+cannon_z_offset};
  // var origin_ball = {x:0, y:0, z:0};
  // inertia = ellipsoid_inertia(ball_radius,ball_radius,ball_radius,specs.density);
  // xbody = body(origin_ball,{x:0,y:0,z:0},origin_ball,inertia,specs.name+'_cannonball','ground',true,[0,0,0,0]);
  // xbody.dof = dof([0,0,0, null, null, null], specs.name+'_cannonball');
  // collection.upsert(xbody);

  let chassis = boxpoly(com, d, specs.name+'_chassis_poly', 
    specs.chassis_name, rgb, specs.shield.radius);
  collection[chassis.name] = chassis; //collection.upsert(chassis);
  // arm_generator(collection, specs.name, chassis.name,
  //   specs.wheel_base, specs.wheel_radius, rgb);
  
};