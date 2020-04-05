ellipsoid_wheel_nm = function(collection,data) {
  //data={name,parent,origin,mass,Ix,Iy,Iz,turnlock,lowturnboundary,highturnboundary}
  var dofs = [];
  var spindof = {
    "axis":[{"#value":[1,0,0]}],
    "range":[{"#value":[-6.29,6.29]}],
    "state":[{"#value":[0,0],"@type":"Kinematic"}],
    "locked":[{"#value":false}],
    "motioncost":[{"#value":1}],
    "@name":data.name+"__Spin",
    "@type":"Rotation"
  };
  
  if (!data.turnlock) {
    var turndof = {
      "axis":[{"#value":[0,0,1]}],
      "range":[{"#value":[-3.14159,3.14159]}],
      "state":[{"#value":[data.turnangle,0],"@type":"Kinematic"}],
      "locked":[{"#value":true}],
      "motioncost":[{"#value":1}],
      "@name":data.name+"__Turn",
      "@type":"Rotation"
    };
    collection.upsert({'#tag':'contact',"@name":data.name+"__wheelstop",
      "@parent":name,"@type":"DegreeOfFreedom",
      "range":[{"#value":[data.lowturnboundary,data.highturnboundary]}]});
    dofs = [turndof,spindof];
  } else {
    dofs = [spindof];
  }

  collection.upsert({
    '#tag':'rigidbody',
    "@name":data.name+'__Spin',
    "framelocation":[{"#value":data.origin,"@parent":data.parent}],
    "mass":[{"#value":data.mass}],
    "centerofmass":[{"#value":[0,0,0]}],
    "blender":[{"renderinertia":[{"@render":"True"}]}],
    "inertia":[{"#value":[data.Ix,data.Iy,data.Iz,0,0,0]}],
    "degreeoffreedom":dofs
  });
  collection.upsert({'#tag':'contact',"@parent":data.name,"@name":data.name+"__Contact","@type":"Inertia"});

}