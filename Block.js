/*
Calculate inertia and other useful parameters of a block shaped chassis

Expected inputs:
calibration.TrackWidth -- Distance between inside of left and right wheels (m)
calibration.FrameHeight -- The height of the block chassis (m)
calibration.WheelDiameter -- Diameter of the wheel (m)
calibration.WheelWidth -- The maximum width of the wheel (m)
calibration.WheelBase -- Distance from front axle to rear axle (m)
calibration.FrameDensity -- Density of block chassis (kg/m^3)
*/

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