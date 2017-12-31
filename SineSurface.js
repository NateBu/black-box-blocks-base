/*
Expected inputs:
data.calibration.Name -- A name to be used to help name the polygon mesh generated
data.calibration.GridDimension -- To build a square grid ranging from +-data.calibration.GridDimension in both x and y
data.calibration.MaxAmplitude -- The maximum amplitude of any of the waves
data.calibration.NumberOfFacets -- The number of facets in the x and y dimensions (saturates at 100)

Returns:
data.calibration.waves a 10 x 4 array corresponding to 10 waves. 1st column is amplitude, 
  2nd column in wavelength, 3rd column is direction, 4th column is phase
data.calibration.polygon a struct containing the grid vertices and facets
*/

output = {

//'natebu_w_sinesurface'
  makedatabase:function(collection,name,project,chassis,constraintpoint,upaxis,waves,facets,vertices) {
    collection.upsert({
      '@name':name,
      '#tag':'externalclass',
      '@type':'ExternalObject',
      '@class':project,
      'callphase':[{'@environment':true}],
      'point':[{'@parent':chassis,'@domdatatype':'double','#value':constraintpoint}],
      'yawaxis':[{'@domdatatype':'double','#value':upaxis}],
      'waves':{'waves':{'#value':waves}}
    });
      
    collection.upsert({
      '#tag':'polygon',
      '@name':name+'_sinesurface',
      '@render':'true',
      'origin':[{'@parent':'ground','#value':[0,0,0]}],
      'rotation':[{'#value':[0,0,0]}],
      'vertices':[{'#value':vertices}],
      'tris':[{'#value':facets}]
    })
  },
  constructor:function() {
  },
  calibrate:function(context) {
    var cal = context.calibration;
    var z = sinesurface.sinesurface(cal.GridDimension, cal.GridDimension,
      cal.MaxAmplitude, cal.NumberOfFacets);
    this.makedatabase(context.collection, cal.Name, cal.nmproject, cal.chassis,
      cal.constraintpoint, cal.upaxis, z.waves, z.facets, z.vertices);
    //cal.__set__(['polygon','waves'])
  }
};
/*
	<widget name="SurfaceLock" type="widget::NateBu:SineSurface_data">
		<calibration value=":::ArenaDimension:::" name="GridDimension"/>
		<calibration value=":::VehicleName:::__Frame" name="Chassis"/>
		<calibration value="-:::WheelDiameter:::/2" name="ConstraintPointZ" formula="true"/>
		<calibration value="0 0 1" name="UpAxis"/>
	</widget>
	<calibration name="waves" type="String"/>
	<calibration name="polygon" type="String"/>
*/