export function environment(three, ground_geometry) {
  ground_geometry.computeVertexNormals(true);
  let color = 0x333333;
  var material = new THREE.MeshPhongMaterial({ 
	  color: color, flatShading:false
	}); 

  var light = new THREE.DirectionalLight( 0xffffff, 1.125 );
	light.position.set( 0, 0, 4 ).normalize();
	light.name = 'light';
	three.add_object( light );
	
  var ambient = new THREE.AmbientLight( 0x111111 );
  ambient.name = 'ambient';

// 	delete three.scene.fog; 
// 	three.scene.fog = new THREE.FogExp2( color, 0.05 );

	three.scene.background = new THREE.Color( color );

	ground_geometry.computeVertexNormals();
	var mesh = new THREE.Mesh( ground_geometry, material );
  mesh.name = 'ground';

  three.add_object(mesh);
};