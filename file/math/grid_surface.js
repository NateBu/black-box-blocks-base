export function grid_surface(xmin, xmax, ymin, ymax, nx, ny, heightf, filterf) {
  let vertices = [];
  let indices = [];

  let yspc = (ymax-ymin)/ny;
  let xspc = (xmax-xmin)/nx;
  let zz = [];
  for (var r = 0; r < ny; r++) {
    for (var c = 0; c < nx; c++) {
      let z = heightf(xmin + c*xspc, ymin + r*yspc);
      zz.push(z);
    }
  }

  for (let r = 0; r < ny; r++) {
    for (let c = 0; c < nx; c++) {
      let x = xmin + c*xspc;
      let y = ymin + r*yspc;
      let z = zz[r*nx + c];
      vertices.push( x,y,z );
      if (c<nx-1 && r<ny-1 && ((!filterf) || filterf(x, y, x+xspc, y+yspc))) {
        let f0 = (r)  *nx+c+1;
        let f1 = (r+1)*nx+c+1;
        let f2 = (r+1)*nx+c;
        let f3 = (r)  *nx+c;
        indices.push(f0, f1, f2);
        indices.push(f2, f3, f0);
      }
    }
  }
  return {indices:indices, vertices:vertices};
}