/*
Create an ellipsoid shaped wheel for nm
*/
output = {
  constructor:function() {},
  calibrate:function(context) {
    // Get inertial characteristics of ellipsoid
    var cal = context.calibration;
    var d = cal.WheelDiameter;
    var z = ellipsoid.calc_ellipsoid_inertia(cal.WheelWidth,d,d,cal.WheelDensity);
    console.log('Name',cal.Name,cal.WheelIsLocked,cal.InitialAngle);
    // Put nm xml elements in the database
    var wheeldata = {
      name:cal.Name,
      parent:cal.parent,
      origin:cal.origin,
      mass:z.mass, Ix:z.Ix, Iy:z.Iy, Iz:z.Iz,
      turnlock: cal.WheelIsLocked,
      turnangle: cal.InitialAngle,
      lowturnboundary:cal.TurnRangeLower,
      highturnboundary:cal.TurnRangeUpper
    };
    nmellipsoid.ellipsoid_wheel_nm(context.collection,wheeldata);
  }
};