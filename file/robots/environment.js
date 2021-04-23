import { round_sine_surface } from '/vybots/math/sine_surface.js';

export function environment(three, CONFIG) {

  let g_rgb = [0.2,0.2,0.2];
  let g_rgb255 = 'rgb('+g_rgb.map(c => `${Math.floor(c*255)}`).join(',')+')';
  let env_rgb = 0x000000;

  // Set background and fog
	three.scene.background = new THREE.Color( 0xcccccc );
	delete three.scene.fog; 
	three.scene.fog = new THREE.FogExp2( env_rgb, 0.05 );

  // Get ground geometry
  let ground = round_sine_surface("excellent", CONFIG.arena_size, CONFIG.amplitude, 200);
  let geometry = new THREE.BufferGeometry();  
  geometry.setIndex( ground.geometry.indices );
  geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( ground.geometry.vertices, 3 ) );
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  
  // Set ground color
  let zmax = geometry.boundingBox.max.z;
  let zmin = geometry.boundingBox.min.z;
  let denom = (zmin == zmax) ? 1 : zmax-zmin;
  let colors = [];
  let dq = CONFIG.swarms_config[0].dq;
  for (var ii = 0; ii < ground.geometry.vertices.length; ii+=3) {
    let x = ground.geometry.vertices[ii+0];
    let y = ground.geometry.vertices[ii+1];
    let z = ground.geometry.vertices[ii+2];
    let r = Math.sqrt(x*x + y*y);
    let colr = g_rgb;
    if (r > CONFIG.arena_size*0.8 && r < CONFIG.arena_size*1.1) {
      let q = Math.atan2(y,x);
      if (q < 0) q += Math.PI*2;
      let jj = Math.max(0,Math.min(CONFIG.number_of_swarms-1, Math.floor(q/dq)));
      colr = CONFIG.swarms_config[jj].rgb.map(c => c*0.5);
    }
    let c = (z-zmin)/denom;
    colors.push(colr[0]*c, colr[1]*c, colr[2]*c);
}
  geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
  // let material = new THREE.MeshPhongMaterial({ color:ground_color, flatShading:false}); 
  let material = new THREE.MeshPhongMaterial({ vertexColors: true }); 
	let mesh = new THREE.Mesh( geometry, material );
  mesh.name = 'ground';
  three.add_object(mesh);

  // Build world cylinder
  let extrudeSettings = {amount:CONFIG.arena_size, steps:1, bevelEnabled:false, curveSegments:24};
  let arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, 1.1*CONFIG.arena_size, 0, Math.PI * 2, 0, false);
  let holePath = new THREE.Path();
  holePath.absarc(0, 0, 1.0*CONFIG.arena_size, 0, Math.PI * 2, true);
  arcShape.holes.push(holePath);
  let wall_geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);
  wall_geometry.translate(0, 0, -CONFIG.arena_size/2);
  wall_geometry.computeVertexNormals();
  let wall_material = new THREE.MeshPhongMaterial( {color: env_rgb} );
  let wall = new THREE.Mesh( wall_geometry, wall_material );
  wall.name = 'wall';
  three.add_object( wall );

  // Build world lid
  let lid_geometry = new THREE.CylinderGeometry( 1.1*CONFIG.arena_size, 1.1*CONFIG.arena_size, .01*CONFIG.arena_size, 24, 1 );
  lid_geometry.rotateX(Math.PI/2);
  lid_geometry.translate(0, 0, CONFIG.arena_size/2);
  let lid = new THREE.Mesh( lid_geometry, wall_material );
  lid.name = 'lid';
  three.add_object( lid );

  // Add a directional light
  var light = new THREE.DirectionalLight( 0xffffff, 1.125 );
	light.position.set( 0, 0, CONFIG.arena_size ).normalize();
	light.name = 'light';
	three.add_object( light );
	
  // Add an ambient light
  var ambient = new THREE.AmbientLight( 0xbbbbbb );
  ambient.name = 'ambient';
	three.add_object( ambient );

  return ground;
};