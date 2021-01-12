import { sine_surface } from '/vy/vybots/math/sine_surface.js';

export function environment(three, arena_size, amplitude) {

  let ground_color = 0x5555ff;
  let wall_color = 0x555555
  let background_fog_color = 0x333333;

  // Set background and fog
	three.scene.background = new THREE.Color( background_fog_color );
	// delete three.scene.fog; 
	// three.scene.fog = new THREE.FogExp2( background_fog_color, 0.05 );

  // Build the ground surface
  let ground = sine_surface("excellent", arena_size, amplitude, 200);
  ground.geometry.computeVertexNormals(true);
  let material = new THREE.MeshPhongMaterial({ color:ground_color, flatShading:false}); 
	ground.geometry.computeVertexNormals();
	let mesh = new THREE.Mesh( ground.geometry, material );
  mesh.name = 'ground';

  // Build the arena walls
  // for (var ii = 0; ii < 2; ii++) {  // Build 4 arena walls
  //   for (var jj = -1; jj < 2; jj+=2) {
  //     let dims = [arena_size*2, arena_size*2, arena_size*2];
  //     let trns = [0, 0, 0];
  //     trns[ii] = jj*arena_size;
  //     dims[ii] = arena_size/50;
  //     let wall_geometry = new THREE.BoxGeometry(dims[0], dims[1], dims[2]);
  //     wall_geometry.translate(trns[0], trns[1], trns[2]);
  //     let wall_material = new THREE.MeshBasicMaterial( {color: wall_color} );
  //     let wall = new THREE.Mesh( wall_geometry, wall_material );
  //     three.add_object( wall );
  //   }
  // }
  let extrudeSettings = {amount:arena_size, steps:1, bevelEnabled:false, curveSegments:24};
  let arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, 1.1*arena_size, 0, Math.PI * 2, 0, false);
  let holePath = new THREE.Path();
  holePath.absarc(0, 0, 1.0*arena_size, 0, Math.PI * 2, true);
  arcShape.holes.push(holePath);
  let wall_geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);
  wall_geometry.translate(0, 0, -arena_size/2);
  let wall_material = new THREE.MeshBasicMaterial( {color: wall_color} );
  let wall = new THREE.Mesh( wall_geometry, wall_material );
  three.add_object( wall );


  // Add a directional light
  var light = new THREE.DirectionalLight( 0xffffff, 1.125 );
	light.position.set( 0, 0, arena_size ).normalize();
	light.name = 'light';
	three.add_object( light );
	
  // Add an ambient light
  var ambient = new THREE.AmbientLight( 0xbbbbbb );
  ambient.name = 'ambient';
	three.add_object( ambient );

  three.add_object(mesh);

  return ground;
};