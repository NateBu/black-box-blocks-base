import { VY } from '/vybase/VY.js';

import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three/examples/jsm/controls/OrbitControls.js';
window.THREE = THREE;

export let three = {};
let animate = function() {
  if (three.INACTIVE) {
    setTimeout(animate,200);
    if (three.ORBITCONTROLS) three.controls.update();
    three.render();
  } else {
    requestAnimationFrame( animate );
    if (three.ORBITCONTROLS) three.controls.update();
    three.render();
  }
};

three = {
  ORBITCONTROLS:true,
  INACTIVE:false,
  scene:null, 
  camera:null, 
  renderer:null, 
  controls:null,
  div:null,
  render: function() {
    this.renderer.render( this.scene, this.camera );
  },
  init: function(div) {
    if (div.offsetWidth === 0 || div.offsetHeight === 0) {
      let self = this;
      setTimeout(function() {  
        self.init(div);  
      },1000); // wait til loaded
      return;
    }
    
    // div.addEventListener("mousemove", function(e){
    //   e.stopPropagation();
    //   e.preventDefault();
    //   console.log('hi')
    // })
    
    let width = div.offsetWidth;
    let height = div.offsetHeight;
    var fov = 70;
    var near = 0.1;
    var far = 10000;
    //this.camera = new THREE.PerspectiveCamera( 20, (height !== 0) ? width / height : 1, 1, 10000 );
    this.div = div;
    this.camera = new THREE.PerspectiveCamera( fov, (height !== 0) ? width / height : 1, near, far);
		this.camera.position.z = 1800;
    //this.camera.position = {x: -400, y: -400, z: 220};
    this.camera.up.set( 0, 0, 1 );
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xcccccc );
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setSize( width, height );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    div.innerHTML = '';
    div.appendChild(this.renderer.domElement);
    if (three.ORBITCONTROLS) {
      this.controls = new OrbitControls( this.camera,  this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;
    }
    animate();
    
    let resize_three = function() {
      let w = div.offsetWidth; // window.innerWidth
      let h = div.offsetHeight; // window.innerHeight
      three.camera.aspect = w / h;
      three.camera.updateProjectionMatrix();
      three.renderer.setSize( w, h );
    };
    window.addEventListener('resize', resize_three);
    
  },
  remove_object: function(name) {
    var object = this.scene.getObjectByName( name );
    if (object) {
      if (object.type === 'Mesh') {
        object.geometry.dispose();
        object.material.dispose();
      }
      this.scene.remove(object);
    }
  },
  add_object: function(obj) {
    if (!obj.hasOwnProperty('name')) {
      VY.log.write('Object was not added. It should have a name');
      return false;
    }
    this.remove_object(obj.name);
    this.scene.add(obj);
  }
};
