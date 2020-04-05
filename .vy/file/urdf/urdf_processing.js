to_collection = function(urdf,collection) {
  var nrmax = function(axis) {
    var nrm = math.sqrt(axis[0]*axis[0]+axis[1]*axis[1]+axis[2]*axis[2]);
    if (nrm===0) {
      console.log('Axes cannot be zero length!!');
      return [0,0,1];
    } else {
      return [axis[0]/nrm,axis[1]/nrm,axis[2]/nrm];
    }
  };
  
  var attr_to_arr = function(xml,att,default_) {
      if (xml && xml[0] && xml[0][att]) {
        return xml[0][att].split(' ').map(function(v) {
          return parseFloat(v);
        }); 
      } else {
        return default_;
      }
  };
  
  var parse_mass = function(link) {
    try {
      return parseFloat(link.inertial[0].mass[0]['@value']);
    } catch(err) {
      BMa.logError(err);
      return 1;
    }
  };
  
  var parse_inertia = function(link) {
    try {
      return ['@ixx','@iyy','@izz','@ixy','@iyz','@ixz'].map(function(r) {
        return parseFloat(link.inertial[0].inertia[0][r]);
      });
    } catch(err) {
      BMa.logError(err);
      return [1,1,1,0,0,0];
    }
  };
  
  var six_dof = function(jointname) {
    var xyz = ['tx','ty','tz','rx','ry','rz'];
    return [0,1,2,3,4,5].map(function(p) {
      var ax = [0,0,0]; ax[p%3]=1;
      return {'name':jointname+xyz[p],'rotation':(p<=2),'axis':ax,'position':0};
    });
  };
  
  var build_tree = function(urdf) {
    var x = {xbody:{}};
    var joints = urdf.joint;
    var links = urdf.link;
    var colors = {};
    if (urdf.hasOwnProperty('material')) {
      urdf.material.forEach(function(mat) {
        if (mat['@name']) colors[mat['@name']] = attr_to_arr(mat.color,'@rgba',[0,0,0,0]);
      });
    }
    
    links.forEach(function(link) {
      
      // Add an "xbody" for the inertia of each link
      if (link.inertial) {
        var ibody = {
          '#tag':'xbody',
          '@name':link['@name']+'_inertia',
          '@parent':link['@name'],
          'txyz': attr_to_arr(link.inertial.origin,'@xyz',[0,0,0]),
          'rxyz': attr_to_arr(link.inertial.origin,'@rpy',[0,0,0]),
          'dof':[],
          'renderinertia':false,
          'mass':parse_mass(link),
          'inertia':parse_inertia(link),
          'com':[0,0,0]
        };
        x.xbody[ibody['@name']] = ibody;
      }

      // Add an "xbody" for each link [finish defining later when going through joints]
      x.xbody[link['@name']] = {'@name':link['@name'],'#tag':'xbody'};
            
      // Add an xbody for each visual
      var count = 0;
      if (link.visual) {
        link.visual.forEach(function(visual) {
          var pname = link['@name'] + '_visual_' + count;
          // Add an "xbody" for each link
          var p = {
            '#tag':'xbody',
            '@name':pname,
            '@parent':link['@name'],
            'txyz': attr_to_arr(visual.origin,'@xyz',[0,0,0]),
            'rxyz': attr_to_arr(visual.origin,'@rpy',[0,0,0]),
            'dof':[]
          };
          
          if (visual.geometry[0].hasOwnProperty('box')) {
            var size = attr_to_arr(visual.geometry[0].box,'@size',[1,1,1]).toString();
            p.shape = [{'box':[{'@size':size,'#value':''}]}];
          } else if (visual.geometry[0].hasOwnProperty('cylinder')) {
            // x3dom cylinder axis is along Y, urdf is along z. So need a rotation of pi/2 about x
            p.rxyz = euler.R2xyz(math.multiply(euler.xyz2R(p.rxyz),euler.xyz2R([math.pi/2,0,0])));
            p.shape = [{'cylinder':[{
              '@radius':visual.geometry[0].cylinder[0]['@radius'],
              '@height':visual.geometry[0].cylinder[0]['@length']
            }]}];
          } else if (visual.geometry[0].hasOwnProperty('sphere')) {
            p.shape = [{'sphere':visual.geometry[0].sphere}]; // has radius attribute
          } else if (visual.geometry[0].hasOwnProperty('mesh')) {
            var filename = visual.geometry[0].mesh[0]['@filename'];
            p.scale = attr_to_arr(visual.geometry[0].mesh,'@scale',[1,1,1]);
            if (filename.endsWith('.stl')) {
              p.shape = [{'indexedFaceSet':stl.binary_to_x3dom(window[filename])}]; // has radius attribute
            }
          }
          
          if (visual.material && visual.material[0]) {
            var rgba = colors[visual.material[0]['@name']] || [0,0,0,0];
            rgba = attr_to_arr(visual.material[0].color,'@rgba',rgba);
            
            // I don't see this in the urdf documentation but some materials seem to be defined in a link then used elsewhere
            if (visual.material[0]['@name']) colors[visual.material[0]['@name']] = rgba;
            
            p.shape[0].appearance = [{'material':[{
              '@diffuseColor':rgba[0]+','+rgba[1]+','+rgba[2],
              '@transparency':Math.max(0,Math.min(1,1-rgba[3]))+''
            }]}];
          }
          //<Material ambientIntensity='0.2' diffuseColor='0.8,0.8,0.8' emissiveColor='0,0,0' metadata='X3DMetadataObject' shininess='0.2' specularColor='0,0,0' transparency='0' ></Material> 
          p.shape[0].name = p['@name'];
          x.xbody[pname] = p;
          count++;
        });
      }
    });
    
    // Now finish defining the bodies
    joints.forEach(function(joint) {
      var rb = x.xbody[joint.child[0]['@link']];
      rb['@parent'] = joint.parent[0]['@link'];
      rb.txyz = attr_to_arr(joint.origin,'@xyz',[0,0,0]);
      rb.rxyz = attr_to_arr(joint.origin,'@rpy',[0,0,0]);
      
      var jt = joint['@type'].toLowerCase();
      if (['revolute','continuous','prismatic'].indexOf(jt) > -1) {
        rb.dof = [{
          'name':joint['@name'],
          'rotation':jt!=='prismatic',
          'axis':nrmax(attr_to_arr(joint.axis,'@xyz',[1,0,0])),
          'position':0
        }];
      } else if (['floating','fixed'].indexOf(jt) > -1) {
        var locked = (jt == 'fixed') ? 'true' : 'false';
        rb.dof = six_dof(joint['@name']);
      } else if (joint['@type'].toLowerCase()=='planer') {
        // Not sure how to do this one
      }
    });
    
    return x;
    
  };
  
  var x = build_tree(urdf);
  
  var dofs = [];
  for (var rbname in x.xbody) {
    rb = x.xbody[rbname];
    // Any links without a framelocation are linked by 6dofs to ground
    if (!rb.hasOwnProperty('@parent')) {
      rb['@parent'] = 'ground';
    }
    if (rb.hasOwnProperty('dof')) {
      rb.dof.forEach(function(dof) {
        dofs.push(dof.name);
      });
    }
    collection.upsert(rb);
  }
  collection.upsert({
    '#tag':'metamodel',
    '@name':'modelmap',
    '#scenarioname':'--',
    'degree_of_freedom_order':dofs
  });
};