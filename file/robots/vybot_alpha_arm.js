export function arm_generator(collection, namebase, parent, wheel_base, wheel_radius, rgb) {
  let lengths = [
    {l:wheel_base*0.25, a:-1.2},
    {l:wheel_base*0.25, a:-1.3},
    {l:wheel_base*0.25, a:0.7}
  ];
  let d = 0;
  let x = wheel_base/4;
  let radius = wheel_radius/10;
  for (var ii=0; ii<lengths.length; ii++) {
    let name = namebase+`arm_${ii}`;
    let l = lengths[ii].l;
    collection[name] = {type:'xbody', name:name, parent:parent, rxyz:[0,0,0], txyz:[x,0,d],
      dof:[{'name':name+'_ry','axis':[0,1,0],'rotation':true,'position':lengths[ii].a}],
      shape:[{
        txyz:[0,0,l/2],
        rxyz:[1.57,0,0],
        name:name+'_cylinder',
        geometry:{
          type:'CylinderGeometry',
          arguments:[radius, radius, l, 20]
        },
        material:{
          type:'MeshStandardMaterial',
          arguments:[{depthTest:true, depthWrite:true, color:rgb, emissive:rgb}]
        }
      }]
    };
    parent = name;
    d = l;
    x = 0;
  }
};

/*let maths = {
  emult : function(v,w) {
    let s = [];
    for (var ii = 0; ii < v.length; ii++) {
      s.push(v[ii]*w[ii]);
    }
    return s;
  },
  dot : function(v,w) {
    let s = 0;
    for (var ii = 0; ii < v.length; ii++) {
      s += v[ii]*w[ii];
    }
    return s;
  },
  transpose: function(M) {
    let Mt = [];
    for (var jj = 0; jj < M[0].length; jj++) {
      Mt.push([]);
      for (var ii = 0; ii < M.length; ii++) {
        Mt[jj].push(M[ii][jj]);
      }
    }
    return Mt;
  },
  vxMt : function(v,Mt) { // get vector back
    let out = [];
    for (var ii = 0; ii < Mt.length; ii++) {
      out.push(this.dot(v,Mt[ii]));
    }
    return out;
  },
  Mtxv : function(M,v) { return this.vxM(v,M);  },
  Mxv : function(M,v) { return this.vxMt(v,M);  },
  vxM : function(v,M) { return this.vxMt(v,this.transpose(M));  },
  MxM : function(M,N) { return this.MxMt(v,this.transpose(N));  },
  MxMt : function(M,Nt) {
    MN = [];
    for (var ii = 0; ii < M.length; ii++) {
      MN.push([]);
      for (var jj = 0; jj < Nt.length; jj++) {
        MN[ii].push(this.dot(M[ii], Nt[jj]));
      }
    }
    return MN;
  },
  inv: function(A) {// only for 2x2
    let det = A[0][0]*A[1][1] - A[1][0]*A[0][1];
    return [[A[1][1]/det, -A[0][1]/det], [-A[1][0]/det, A[0][0]/det]];
  },
  rpinv : function(A) {
    // Right pseudo inverse: e.g. A = 2x3 matrix: Ap = A'*(A*A') Ap = 3x2
    let At = this.transpose(A);
    let Ax = this.MxM(A,At);
    Ax = this.inv(Ax);
    return this.MxM(At,Ax);
  }
};


const calc_activation = function(body) {
  let lb = body.sk[body.sk.length-1];
  let J = lb.dendpointdq;
  let R = body.moment_arms;
  let m = body.mu.length;
  let ep = lb.endpoint;
  let q = Math.atan2(body.co.y-ep[1],body.co.x-ep[0]) - Math.PI/2;
  let Fmax = body.mu.map(mu => mu.fmax);
  let z = maths.vxM([Math.cos(q),Math.sin(q)],J);
  z = maths.vxM(z,R);
  // z = maths.emult(Fmax,z);
  // let act = linprog(z,[],[],[],[],zeros(m,1),ones(m,1),options);
  let ma = 0;
  for (var ii = 0; ii < act.length; ii++) {
    ma = Math.max(ma,Math.abs(act[ii]));
  }
  if (ma > 1) { act.forEach(a => a/ma); }
  for (var kk = 0; kk < body.mu.length; kk++) {
    body.mu[kk].activation = max(-1,min(1,act[kk]));
  }
};

const inip = function(bod, d, s) {
  return (bod === 0) ? {bod:bod, p:[-0.05 - d,s]} : {bod:bod, p:[ 0.75 - d,s]};
};

const monoart = function(bod,sgn,d,s) {
  let vp = [inip(bod-1,d,s),{bod:bod, p:[sgn*s, s]},{bod:bod, p:[d+0.25, s]}];
  return {viapoints:vp,q0:[0,0,0],l0:0,fmax:20};
};

const init = function(body) {
  for (var ii = 0; ii < body.sk.length; ii++) {
    if (!body.sk[ii].angle) body.sk[ii].angle = body.sk[ii].angle0;
    if (!body.sk[ii].dangledt) body.sk[ii].dangledt = 0;
  }
  for (var ii = 0; ii < body.mu.length; ii++) {
    if (!body.mu[ii].activation) body.mu[ii].activation = 0;
  }
  dynamics(body,0);
  correction(body);
}

const minabs = function(dq) {
  return Math.min.apply(null, dq.map(dqq => Math.abs(dqq)));
}

const maxabs = function(dq) {
  return Math.max.apply(null, dq.map(dqq => Math.abs(dqq)));
}

const constraint = function(arm) {
  let maxa = 0.1; // Max angle change
  let lastarm = arm.sk[arm.sk.length-1];
  for (var jj = 0; jj < 20; jj++) {
    let de = [arm.co.x - lastarm.endpoint[0], arm.co.y - lastarm.endpoint[1]];
    let nde = Math.sqrt(de[0]*de[0] + de[1]*de[1]);
    let dir = nde - arm.co.radius;
    let de = de/nde*dir;
    if (Math.abs(dir) < 1e-2) break;
    let Jp = maths.pinv(lastarm.dendpointdq);
    let dq = maths.vxMt(de,Jp);
    let dqmax = maxabs(dq);
    if (dqmax > maxa) dq.forEach(dqq => dqq*maxa/dqmax);
    let dof = {};
    for (var ii = 0; ii < dq.length; ii++) {
        dof[name] = dofname + dq[ii];
    }
    dynamics(arm,0);
  }
}

const dynamics = function(body,dt) {
    joints(body);
    muscles(body);
    let ebody = body.sk[body.sk.length-1];
    let J = ebody.dendpointdq;
    let Ii = [[1,0,0],[0,1,0],[0,0,1]]; //maths.inv(eye(3));
    let f = body.mu.map(mu => mu.force);
    let muscle_torque = maths.Mvx(f,body.moment_arms);
    if (body.co && dt > 0) {
        // Impulse eq:  (J'*Fend + T)*dt = I*qdot
        // Fend = some reaction force at the endpoint constraint
        // Also constraint equation r*(J*qdot0) = 0
        // where r is the vector from the endpoint to the center of the
        // pedal constraint. i.e. velocity is perp to r
        // Minimize Fend'*Fend
        let r = [body.co.x-ebody.endpoint[0], body.co.y-ebody.endpoint[1]];
        let rJ = maths.vxM(r, J);
        let rJIi = maths.vxM(rJ, Ii); // r'*J*Ii;
        b = maths.dot(rJIi, muscle_torque);
        a = maths.MxMt(rJIi, J);
        Fend = (a\b);
    } else {
        Fend = [0;0];
    }
    dqdt = Ii*(J'*Fend + muscle_torque);
    for ii = 1:length(dqdt)
        body.sk[ii].dangledt = dqdt[ii];
        body.sk[ii].angle = body.sk[ii].angle+dqdt[ii]*dt;
    end
    correction(body);
}

function body = muscles(body)
    dqdt = [body.sk(:).dangledt]';
    body.muscle_force= zeros(length(body.mu),1);
    body.moment_arms = zeros(length(body.sk),length(body.mu));
    for ii = 1:length(body.mu)
        body.mu[ii].length = 0;
        body.mu[ii].velocity = 0;
        body.moment_arms(:,ii) = zeros(length(body.sk),1);        
        for jj = 1:length(body.mu[ii].viapoints)
            v = body.mu[ii].viapoints(jj);
            if (v.bod == 0)
                body.mu[ii].viapoints(jj).pg = v.p;
                body.mu[ii].viapoints(jj).dpgdt = [0;0];
            else
                b = body.sk(v.bod);
                body.mu[ii].viapoints(jj).pg = b.origin + b.R*v.p*b.length;
                body.mu[ii].viapoints(jj).dpgdt = b.dorigindq*dqdt + ...
                    (b.dRdt)*v.p*b.length;
            end
            if (jj > 1)
                pd = body.mu[ii].viapoints(jj).pg-body.mu[ii].viapoints(jj-1).pg;
                npd = norm(pd);
                body.mu[ii].length = body.mu[ii].length + npd;
                vel = body.mu[ii].viapoints(jj).dpgdt - body.mu[ii].viapoints(jj-1).dpgdt;
                body.mu[ii].velocity = body.mu[ii].velocity + dot(vel,pd)/npd;
                if (body.mu[ii].viapoints(jj).bod ~= body.mu[ii].viapoints(jj-1).bod)
                    pd = pd/npd;
                    od = body.mu[ii].viapoints(jj).pg-body.sk(v.bod).origin;
                    body.moment_arms(v.bod,ii) = od(2)*pd(1) - pd(2)*od(1);
                end
            end
        end
        body.mu[ii].force = body.mu[ii].activation * body.mu[ii].fmax;
    end
end

const sum = function(arr) {
  let s = 0; arr.forEach(a => s+=a); return s;
}
const sumf = function(arr,f) {
  let s = 0; arr.forEach(a => s+=a[f]); return s;
}

const joints = function(body) {
  let qtot = 0;
  for (var ii = 0; ii < body.sk.length; ii++) {
    qtot += body.sk[ii].angle;
    let cq = Math.cos(qtot);
    let sq = Math.sin(qtot);
    body.sk[ii].R = new THREE.Matrix3(); body.sk[ii].R.set(cq,-sq,0,sq,cq,0,0,0,1);
    body.sk[ii].dRdqj = new THREE.Matrix3(); body.sk[ii].dRdqj.set(-sq,-cq,0,cq,-sq,0,0,0,1);
    // SAME FOR ALL ANGLES
    if (ii == 0) {
        body.sk[ii].origin = new Vector3(0,0,0);
        body.sk[ii].dorigindq = zeros(2,length(body.sk));
    } else {
        body.sk[ii].origin = body.sk[ii-1].endpoint;
        body.sk[ii].dorigindq = body.sk[ii-1].dendpointdq;
    }
    body.sk[ii].endpoint = body.sk[ii].origin + body.sk[ii].R*[body.sk[ii].length,0]';
    body.sk[ii].dendpointdq = body.sk[ii].dorigindq;
    body.sk[ii].dRdt = zeros(2,2);
    for jj = 1:ii
        body.sk[ii].dRdt = body.sk[ii].dRdt + body.sk[ii].dRdqj*body.sk(jj).dangledt;
        body.sk[ii].dendpointdq(:,jj) = ...
            body.sk[ii].dendpointdq(:,jj) + ...
            body.sk[ii].dRdqj*[body.sk[ii].length,0]';
    end
    
  }
}
*/