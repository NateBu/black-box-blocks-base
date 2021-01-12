
let extrusion = function(points, extrudeSettings) {
  var shape = new THREE.Shape();
  for (var ii = 0; ii < points.length; ii++) {
    if (ii === 0) {
      shape.moveTo( points[ii].x, points[ii].y );
    } else {
      shape.lineTo( points[ii].x, points[ii].y );
    }
  }
  shape.lineTo( points[0].x, points[0].y );
  return new THREE.ExtrudeGeometry( shape, extrudeSettings );  
};

let three_variable_arguments = function(x,a) {
  return (a.length===0) ? new THREE[x]() :
    ((a.length===1) ? new THREE[x](a[0]) : 
    ((a.length===2) ? new THREE[x](a[0],a[1]) :
    ((a.length===3) ? new THREE[x](a[0],a[1],a[2]) :
    ((a.length===4) ? new THREE[x](a[0],a[1],a[2],a[3]) :
    ((a.length===5) ? new THREE[x](a[0],a[1],a[2],a[3],a[4]) : null)))));
};

let render_shape = function(vyth,xbody) {
  if (!xbody.hasOwnProperty('shape')) return;
  xbody.shape.forEach(function(shape) {
    let R = xbody.R.clone();
    if (shape.txyz) {
      let RR = new THREE.Matrix4();
      RR.makeTranslation(shape.txyz[0], shape.txyz[1], shape.txyz[2]);      
      R.multiply(RR);
    }
    if (shape.rxyz) {
      let RR = new THREE.Matrix4();
      RR.makeRotationFromEuler(new THREE.Euler( shape.rxyz[0], shape.rxyz[1], shape.rxyz[2], 'XYZ' ));
      R.multiply(RR);
    }
    var geometry = null;
    if (shape.geometry.type === 'Extrusion') {
      geometry = extrusion(shape.geometry.arguments[0], 
        shape.geometry.arguments[1]).applyMatrix4(R);
    } else {
      geometry = three_variable_arguments(
        shape.geometry.type, shape.geometry.arguments).applyMatrix4(R);
    }
    var material = three_variable_arguments(
      shape.material.type, shape.material.arguments);
    var mesh = new THREE.Mesh( geometry, material );
    mesh.name = '|shape|' + shape.name;
    mesh.userData.xbody = xbody.name;
    vyth.add_object(mesh);
  });
};

let render_inertia = function (vyth,xbody) {
  if (!(xbody.hasOwnProperty('mass') && 
    xbody.renderinertia && xbody.hasOwnProperty('inertia')) && 
    xbody.hasOwnProperty('com')) return;
  var mass = xbody.mass;
  var inr = xbody.inertia;
  if (mass <= 0 || !inr) return;
  var inertia = new THREE.Matrix4().set(inr[0],inr[3],inr[5], 0, 
    inr[3],inr[1],inr[4], 0,   inr[5],inr[4],inr[2], 0,    0, 0, 0, 1);
  var t = new THREE.Vector3();
  var q = new THREE.Quaternion();
  var s = new THREE.Vector3(0,0,0);
  inertia.decompose(t, q, s);
  var scale = new THREE.Vector3(Math.sqrt((s.z + s.y - s.x)*2.5/mass),
                                Math.sqrt((s.x + s.z - s.y)*2.5/mass),
                                Math.sqrt((s.y + s.x - s.z)*2.5/mass));
  var geometry = new THREE.SphereGeometry( 1.0, 18, 12 );
  var center = new THREE.Vector3(xbody.com[0], xbody.com[1], xbody.com[2]);
  var R = new THREE.Matrix4().compose(center, q, scale);
  R.premultiply(xbody.R);
  geometry.applyMatrix4( R );
  var material = new THREE.MeshNormalMaterial(
    {transparent:true, opacity:0.4, depthTest:true,depthWrite:true});
  var mesh = new THREE.Mesh( geometry, material );
  mesh.name = '|inertia|' + xbody.name;
  mesh.userData.xbody = xbody.name;
  vyth.add_object(mesh);
  //return {'rotation':rotation.toString(),'scale':scale.toString(),'translation':xbody.com.toString()}
};
  
let reset = function(self) {
  self.bodies = {'ground':{name:'ground', R:new THREE.Matrix4()}};
  self.body_list = [];
}

let xtransform = function(xbody, currentState) {
  // xbody = {name:'bodyB',parent:'bodyA',xyz:[0,0,0],dof:[
  // {name:'bodyBrz',axis:[0,0,1],position:1,rotation:true}
  //]}
  // All translations are done first, then rotations in the order listed in 'dof'
  var translate = new THREE.Vector3(0,0,0);
  var rotate = new THREE.Quaternion(0,0,0,1);
  if (xbody && xbody.txyz) {
    translate.setX(xbody.txyz[0]);
    translate.setY(xbody.txyz[1]);
    translate.setZ(xbody.txyz[2]);
  }
  if (xbody && xbody.rxyz) {
    rotate.setFromEuler(new THREE.Euler( xbody.rxyz[0], xbody.rxyz[1], xbody.rxyz[2], 'XYZ' ));
  }
  if (xbody && xbody.dof) {
    xbody.dof.forEach(function(dof) { // dof.axis BETTER BE ALREADY NORMALIZED!!!
      var position = (currentState && currentState[dof.name]) ? currentState[dof.name] : dof.position;
      currentState[dof.name] = position;
      if (dof.rotation) {
        var cx = Math.cos(position/2);
        var sx = Math.sin(position/2);
        rotate.multiply(new THREE.Quaternion(sx*dof.axis[0],sx*dof.axis[1],sx*dof.axis[2],cx));
      } else {
        translate.addScaledVector(new THREE.Vector3(dof.axis[0], dof.axis[1], dof.axis[2]), position);
      }
    });
  }
  var local = new THREE.Matrix4();
  local.compose(translate, rotate, new THREE.Vector3(1,1,1));
  return local;
  //if (xbody.hasOwnProperty('scale')) transform.scale = xbody.scale.join(',');
};

  let l2g = function(v,prnt) {
    var R = this.bodies[prnt].R;  if (!R) return null;
    return v.clone().applyMatrix4(R);
  };
  
  let v2g = function(v,prnt) {
    var R = this.bodies[prnt].R;  if (!R) return null;
    return v.clone().applyMatrix3( new THREE.Matrix3().setFromMatrix4(R) );
  };
  
  let g2l = function(v,prnt) {
    var R = this.bodies[prnt].R;  if (!R) return null;
    return v.clone().subtract( new THREE.Vector3.setFromMatrixPosition(R) )
      .applyMatrix3( new THREE.Matrix3().setFromMatrix4(R.clone().transpose()) );
    //return (R) ? R.transpose().multMatrixVec(w.subtract(R.e3())) : null;
  };
  
  let g2v = function(v,prnt) {
    var R = this.bodies[prnt].R;  if (!R) return null;
    return v.clone()
      .applyMatrix3( new THREE.Matrix3().setFromMatrix4(R.clone().transpose()) );
    //return (R) ? R.transpose().multMatrixVec(w) : null; 
  };
  
  let dispose = function () {
    //https://stackoverflow.com/questions/33152132/three-js-collada-whats-the-proper-way-to-dispose-and-release-memory-garbag/33199591#33199591
    for (var ii=this.three.scene.children.length-1; ii>=0; ii--) {
      var node = this.three.scene.children[ii];
      if ( (!node.hasOwnProperty('name')) ||
          (!node.name.startsWith('|')) ) continue;
      if (node instanceof THREE.Mesh) {
          if (node.geometry) {
              node.geometry.dispose();
          }
          if (node.material) {
              if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial) {
                  node.material.materials.forEach(function (mtrl, idx) {
                      if (mtrl.map) mtrl.map.dispose();
                      if (mtrl.lightMap) mtrl.lightMap.dispose();
                      if (mtrl.bumpMap) mtrl.bumpMap.dispose();
                      if (mtrl.normalMap) mtrl.normalMap.dispose();
                      if (mtrl.specularMap) mtrl.specularMap.dispose();
                      if (mtrl.envMap) mtrl.envMap.dispose();
                      mtrl.dispose();    // disposes any programs associated with the material
                  });
              }
              else {
                  if (node.material.map) node.material.map.dispose();
                  if (node.material.lightMap) node.material.lightMap.dispose();
                  if (node.material.bumpMap) node.material.bumpMap.dispose();
                  if (node.material.normalMap) node.material.normalMap.dispose();
                  if (node.material.specularMap) node.material.specularMap.dispose();
                  if (node.material.envMap) node.material.envMap.dispose();
                  node.material.dispose();   // disposes any programs associated with the material
              }
          }
          this.three.scene.remove(node);
      } else {
        console.log('xbody.dispose unknown type',node.name, node.type)
      }
    }
  };
  
  let set_state = function(state) {
    var RxR = {'ground' : new THREE.Matrix4()}; // incremental tranformation from "last state" to "state"
    for (var ii=0; ii<this.body_list.length; ii++) {
      var name = this.body_list[ii];
      var Rx = xtransform(this.bodies[name], state);
      var Rp = this.bodies[this.bodies[name].parent].R;
      RxR[name] = new THREE.Matrix4()
        .extractRotation(this.bodies[name].R.clone().transpose());
      RxR[name].setPosition(new THREE.Vector3()
        .setFromMatrixPosition(this.bodies[name].R)
        .negate().applyMatrix4(RxR[name]));
      this.bodies[name].R = new THREE.Matrix4().multiplyMatrices(Rp, Rx);
      RxR[name].premultiply(this.bodies[name].R);
    }
    
    for (var ii=this.three.scene.children.length-1; ii>=0; ii--) {
      var node = this.three.scene.children[ii];
      if ( (!node.hasOwnProperty('name')) ||
          (!node.name.startsWith('|')) ) continue;
      if (node instanceof THREE.Mesh && node.geometry && node.userData.hasOwnProperty('xbody')) {
        node.geometry.applyMatrix4( RxR[node.userData.xbody] );
        node.geometry.verticesNeedUpdate = true;
      }
    }
  }
  
  let init = function(bodies) {
    var self = this;
    reset(self);
    var body_linking = function(parent) {
      let names = Object.keys(bodies);
      for (var ii = 0; ii < names.length; ii++) {
        if (bodies[names[ii]].type == 'xbody' && bodies[names[ii]].parent == parent && self.body_list.indexOf(names[ii]) == -1) {
          let xbody = JSON.parse(JSON.stringify(bodies[names[ii]]));
          xbody.name = names[ii];
          xbody.R = new THREE.Matrix4();
          self.bodies[xbody.name] = xbody;
          self.body_list.push(xbody.name);
          body_linking(xbody.name);
        }
      }
    }
    body_linking('ground');
    //this.dispose();  return;
    this.set_state({});
    for (var ii=0; ii<this.body_list.length; ii++) {
      var xbody = this.bodies[ this.body_list[ii] ];
      render_shape(self.three, xbody);
      render_inertia(self.three, xbody);
    }
  }

export function xbodyf(three) {
  return {
    three:three,
    bodies:{'ground':{name:'ground', R:new THREE.Matrix4()}},
    body_list:[],
    init:init,
    l2g:l2g,
    v2g:v2g, 
    g2l:g2l,
    g2v:g2v,
    dispose:dispose,
    set_state:set_state,
  }  
}
