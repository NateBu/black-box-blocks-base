block_chassis_nm = function(collection,data) {
  //data={name,parent,origin,mass,Ix,Iy,Iz,wheelbase,frameheight,trackwidth}

  collection.upsert({
    '#tag':'polygon',
    '@name':data.name+'__mesh',
    '@render':'true',
    'rotation':[{'#value':[0,0,0]}],
    'origin':[{'@parent':data.name,'#value':[0,data.wheelbase/2,data.frameheight/2]}],
    'box':[{'#value':[data.trackwidth,data.wheelbase,data.frameheight]}]
  });	    
  collection.upsert({
    '#tag':'viewport',
    '@name':'view_'+data.name,
    '@parent':data.name,
    'eye':[{'#value':[0,-6,1]}],
    'center':[{'#value':[0,0,0]}],
    'up':[{'#value':[0,0,1]}],
  });
  
  var dofs = [];
  var dirc = ['x','y','z'];
  ['translation','rotation'].forEach(function(mode) {
    for (var ii = 0; ii<3; ii++) {
      var axis = [0,0,0]; axis[ii] = 1;
      dofs.push({
        "axis":[{"#value":axis}],
        "range":[{"#value":[-6.29,6.29]}],
        "state":[{"#value":[0,0],"@type":"Kinematic"}],
        "locked":[{"#value":false}],
        "motioncost":[{"#value":1}],
        "@name":data.name+"_"+mode.slice(0,1)+dirc[ii],
        "@type":mode
      });
    }
  });

  collection.upsert({
    '#tag':'rigidbody',
    "@name":data.name,
    "framelocation":[{"#value":data.origin,"@parent":data.parent}],
    "mass":[{"#value":data.mass}],
    'blender':[{'renderinertia':[]}],
    "centerofmass":[{"#value":[0,data.wheelbase/2,data.frameheight]}],
    "inertia":[{"#value":[data.Ix,data.Iy,data.Iz,0,0,0]}],
    "degreeoffreedom":dofs
  });

}