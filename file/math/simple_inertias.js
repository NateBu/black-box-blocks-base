export function box_inertia(dx,dy,dz,density) {
  var mass = density*dx*dy*dz;
  var Ix = (dy*dy+dz*dz)*mass/12;
  var Iy = (dx*dx+dz*dz)*mass/12;
  var Iz = (dy*dy+dx*dx)*mass/12;
  return {mass:mass,Ix:Ix,Iy:Iy,Iz:Iz};
}

export function ellipsoid_inertia(dx,dy,dz,density) {
  var mass = density*dx*dy*dz*4/3*Math.PI;
  var Ix = (dy*dy+dz*dz)*mass/5;
  var Iy = (dx*dx+dz*dz)*mass/5;
  var Iz = (dy*dy+dx*dx)*mass/5;
  return {mass:mass,Ix:Ix,Iy:Iy,Iz:Iz};
}
/*

Calculate inertia and other useful parameters of a block shaped chassis

Expected inputs:
calibration.TrackWidth -- Distance between inside of left and right wheels (m)
calibration.FrameHeight -- The height of the block chassis (m)
calibration.WheelDiameter -- Diameter of the wheel (m)
calibration.WheelWidth -- The maximum width of the wheel (m)
calibration.WheelBase -- Distance from front axle to rear axle (m)
calibration.FrameDensity -- Density of block chassis (kg/m^3)

output = {
  constructor:function() {
  },
  calibrate:function(context) {
    var cal = context.calibration; //calibration,publishers,subscribers,quiz,menu
    var dx = cal.TrackWidth;
    var dy = cal.WheelBase;
    var dz = cal.FrameHeight;
    var z = box.calc_box_inertia(dx, dy, dz, cal.FrameDensity);
    // Put nm xml elements in the database
    var chassisdata = {
      name:cal.Name,
      parent:cal.parent,
      origin:cal.origin,
      mass:z.mass, Ix:z.Ix, Iy:z.Iy, Iz:z.Iz,
      wheelbase: cal.WheelBase,
      trackwidth: cal.TrackWidth,
      frameheight:cal.FrameHeight
    };
    chassis.block_chassis_nm(context.collection,chassisdata);
    //data={name,parent,origin,mass,Ix,Iy,Iz,wheelbase,frameheight,trackwidth}
  }
};

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
*/