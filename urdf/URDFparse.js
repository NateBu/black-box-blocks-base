output = {
  constructor:function() {},
  calibrate:function(context) {
    var cal = context.calibration;
    var urdfdata = xml_to_obj(urdffile1);
    urdf.to_collection(urdfdata,context.collection);
  }
};