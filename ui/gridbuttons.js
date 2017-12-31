addbuttons = function(data,d3e) {
  
  //var buttons = this.g.append('g').attr('class','buttons');
  //buttondata = {buttons:[{name:'Start/Stop',state:'Ready',callback:function() {
  //  d3.event.stopPropagation();
  //  self.startstop()
  //})]};
  //gridbuttons.addbuttons(buts,buttons)

  var fillstate = {ready:'#d9534f',disabled:'#dddddd'};
  var h = data.height || 40;
  var w = data.width || 160;
  var x = data.x || 100;
  var y = data.y || 0;
  var buff = data.buffer || 10;
  for (var ii in data.buttons) {
    var bdat = data.buttons[ii];
    y += h+buff;
    var rattr = {width:w,height:h,x:x,y:y,stroke:'white',cursor:'pointer'};
    var rstyle = {fill:fillstate[bdat.state]};
    var g = d3e.append('g');
    var rect = g.append('rect').attr(rattr).style(rstyle);
    if (bdat.state=='ready' && bdat.hasOwnProperty('callback')) {
      rect.on('click', bdat.callback);
    }
    var text = g.append('text')
      .attr({x:x+w/2,y:y+h/2,fill:'white','text-anchor':'middle','pointer-events':'none'});
    var label = bdat.label.split('\n');
    var off = (0.3 - 0.6*(label.length-1)).toFixed(2)+"em";
    for (var jj=0; jj<label.length; jj++) {
      var dy = (jj===0) ? off : "1.2em";
      text.append('tspan').attr({x:x+w/2,dy:dy}).text(label[jj]);
    }

  }

};