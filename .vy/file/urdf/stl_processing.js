//https://raw.githubusercontent.com/tonylukasavage/jsstl/master/index.html
ascii_to_x3dom = function(stl) {
  var state = '';
  var lines = stl.split('\n');
  var name, parts, line, normal, done, faces=[], vertices = [];
  var vCount = 0;
  stl = null;
  for (var len = lines.length, i = 0; i < len; i++) {
      if (done) {
          break;
      }
      line = trim(lines[i]);
      parts = line.split(' ');
      switch (state) {
          case '':
              if (parts[0] !== 'solid') {
                  console.error(line);
                  console.error('Invalid state "' + parts[0] + '", should be "solid"');
                  return;
              } else {
                  name = parts[1];
                  state = 'solid';
              }
              break;
          case 'solid':
              if (parts[0] !== 'facet' || parts[1] !== 'normal') {
                  console.error(line);
                  console.error('Invalid state "' + parts[0] + '", should be "facet normal"');
                  return;
              } else {
                  normal = [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])];
                  state = 'facet normal';
              }
              break;
          case 'facet normal':
              if (parts[0] !== 'outer' || parts[1] !== 'loop') {
                  console.error(line);
                  console.error('Invalid state "' + parts[0] + '", should be "outer loop"');
                  return;
              } else {
                  state = 'vertex';
              }
              break;
          case 'vertex': 
              if (parts[0] === 'vertex') {
                  vertices.push(parseFloat(parts[1]),parseFloat(parts[2]),parseFloat(parts[3]));
              } else if (parts[0] === 'endloop') {
                  //new THREE.Vector3(normal[0], normal[1], normal[2]) )
                  faces.push( vCount*3, vCount*3+1, vCount*3+2 );
                  vCount++;
                  state = 'endloop';
              } else {
                  console.error(line);
                  console.error('Invalid state "' + parts[0] + '", should be "vertex" or "endloop"');
                  return;
              }
              break;
          case 'endloop':
              if (parts[0] !== 'endfacet') {
                  console.error(line);
                  console.error('Invalid state "' + parts[0] + '", should be "endfacet"');
                  return;
              } else {
                  state = 'endfacet';
              }
              break;
          case 'endfacet':
              if (parts[0] === 'endsolid') {
                  done = true;
              } else if (parts[0] === 'facet' && parts[1] === 'normal') {
                  normal = [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])];
                  if (vCount % 1000 === 0) {
                      console.log(normal);
                  }
                  state = 'facet normal';
              } else {
                  console.error(line);
                  console.error('Invalid state "' + parts[0] + '", should be "endsolid" or "facet normal"');
                  return;
              }
              break;
          default:
              console.error('Invalid state "' + state + '"');
              break;
      }
  }
};

binary_to_x3dom = function(stl_) {
  
  // Convert from Uint8Array to ArrayBuffer, can I skip this somehow?
  var dv = new DataView(stl_.buffer, 80); // 80 == unused header
  var isLittleEndian = true;
  var triangles = dv.getUint32(0, isLittleEndian); 
  var res = 3;
  // console.log('arraybuffer length:  ' + stl.byteLength);
  // console.log('number of triangles: ' + triangles);

  var offset = 4;
  var faces = '';
  var tris = '';
  for (var i = 0; i < triangles; i++) {
    // Get the normal for this triangle
    //var nrm = dv.getFloat32(offset, isLittleEndian).toFixed(res)+' '+
    //          dv.getFloat32(offset+4, isLittleEndian).toFixed(res)+' '+
    //          dv.getFloat32(offset+8, isLittleEndian).toFixed(res)+' ';
    offset += 12;

    // Get all 3 vertices for this triangle
    for (var j = 0; j < 3; j++) {
      tris += dv.getFloat32(offset, isLittleEndian).toFixed(res)+' '+
              dv.getFloat32(offset+4, isLittleEndian).toFixed(res)+' '+
              dv.getFloat32(offset+8, isLittleEndian).toFixed(res)+' ';
      faces += ' '+(i*3+j);
      offset += 12;
    }
    faces += ' -1';
    
    // there's also a Uint16 "attribute byte count" that we
    // don't need, it should always be zero.
    offset += 2;   

    // Create a new face for from the vertices and the normal             
    //geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2, normal));
  }
  var ifs = [{'@coordIndex':faces,'coordinate':[{'@point':tris}]}];
  return ifs;
 /*
    <indexedFaceSet solid='false' coordIndex='0 1 2 -1 2 3 0 -1 3 2 4 -1 ...'>
			<coordinate point='4.548 7.797 0 4.196 7.797 1.785 4.137 8.037 1.76 ...'></coordinate>
			<normal vector='-2.89121 -0.759443 -0.000647575 ...'></normal>
		</indexedFaceSet>  
  */
}