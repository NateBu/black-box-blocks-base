export function rk4(x,y,h,params,derivs) {
  let n = y.length, ym = [];
  let k1 = derivs(x, y, params);
  ym = []; for (var ii = 0; ii < n; ii++) { ym.push(y[ii] + k1[ii]*h/2); } 
  let k2 = derivs(x, ym, params);
  ym = []; for (var ii = 0; ii < n; ii++) { ym.push(y[ii] + k2[ii]*h/2); } 
  let k3 = derivs(x, ym, params);
  ym = []; for (var ii = 0; ii < n; ii++) { ym.push(y[ii] + k3[ii]*h  ); } 
  let k4 = derivs(x, ym, params);
  ym = []; for (var ii = 0; ii < n; ii++) { ym.push(y[ii] + ((k1[ii] + 2*(k2[ii]+k3[ii]) + k4[ii])/6)*h  ); } 
  return ym;
};