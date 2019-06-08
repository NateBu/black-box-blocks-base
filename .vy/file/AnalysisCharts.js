(function() {
  let colors = [ 
    'rgba(0,0,255,:)',
    'rgba(0,205,0,:)',
    'rgba(255,0,0,:)',
    'rgba(0,255,255,:)',
    'rgba(255,127,0,:)',
    'rgba(127,0,255,:)',
    'rgba(255,0,255,:)',
    'rgba(200,255,0,:)',
    'rgba(150,150,150,:)',
    'rgba(0,0,0,:)'];
  
  let get_dataset_index = function(chart, label, fill) {
    for (var ii=0; ii<chart.data.datasets.length; ii++) {
      if (chart.data.datasets[ii].label == label) {
        return ii;
      }
    }
    var n = chart.data.datasets.length;
    var color = colors[n % colors.length];
    
    chart.data.datasets.push({
      label:label,
      data:[],
      fill:fill,
      backgroundColor: color.replace(':','0.5'),
      borderColor: color.replace(':','1'),
      borderWidth: 1
    });
    return n;
  };
  
  let get_data_index = function(chart, id, label) {
    var idx = chart.data.ids.indexOf(id);
    if (idx === -1) {
      chart.data.ids.push(id);
      chart.data.labels.push(label);
      chart.data.datasets[0].data.push(null);
      idx = chart.data.datasets[0].data.length-1;
    }
    return idx;
  };
  
  let add_data = function(chart, setlabel, dataid, datalabel, fill, data) {
    var set_indx = get_dataset_index(chart, setlabel, fill);
    var data_indx = get_data_index(chart, dataid, datalabel);
    var n = chart.data.datasets[set_indx].data.length;
    for (var ii = n; ii<data_indx+1; ii++) {
      chart.data.datasets[set_indx].data.push(null);
    }
    chart.data.datasets[set_indx].data[data_indx] = data;
  };
  
  let analysis_chart_ = function(yaxislabel, metric, rslt, charttype) {
    var fill = charttype == 'bar';
    var chart = {
      type:charttype, 
      data:{ ids:[], labels:[], datasets:[]}, 
      options: {
        responsive: true,
        scales: {
          yAxes: [{
            scaleLabel: {display: true, labelString: yaxislabel}, 
            ticks: {beginAtZero:true}
          }],
          xAxes: [{ticks: {display:true,autoSkip:false}}]
        }
      }
    };
    // Get labels and original data set
    
    var baseidx = get_dataset_index(chart, 'Base', fill);
    rslt.forEach(function(x) {
      var value = null;  //dataloc.split('.').reduce((o,i)=>(o&&o.hasOwnProperty(i))?o[i]:null, x);
      try { value = metric(x) } catch(err) {
        console.log('Failed to analyze metric for '+x.name);      
      };
      if (x.regression.id == "-") {
        chart.data.ids.push(x._id);
        chart.data.labels.push(x.name);
        chart.data.datasets[baseidx].data.push(value);
      }
    });
    
    rslt.forEach(function(x) {
      var value = null; //dataloc.split('.').reduce((o,i)=>(o&&o.hasOwnProperty(i))?o[i]:null, x);
      try { value = metric(x) } catch(err) {
        console.log('Failed to analyze metric for '+x.name);      
      };
      if (x.regression.id !== "-") {
        var xb = new Date(x.regression.timestamp);
        var lbl = x.regression.reglabel; //xb.toLocaleDateString() + ' ' + xb.toLocaleTimeString();
        add_data(chart, lbl, x.regression.id, x.name, fill, value);
      }
    });
    //  console.log(JSON.stringify(chart,null,2));
    return chart;
  }
  
  let analysis_chart = function(self, query, fields, plotdata, db) {
    var callback = function(err, rslt) {
      if (!err) {
        
        plotdata.forEach(function(x) {
          var chart = analysis_chart_(x.name, x.metric, rslt, 'bar');
          var id = x.name.replace(/[\W]+/g,"_"); // replace non-alphanumeric
          
          chart.data.labels = chart.data.labels.map(function (l) {
            return l.split(':').pop();
          });
          
          db.insert({
            '#tag':'chartjs',
            window:'chartjs',
            'name':id,
            'data':chart});
        });
      }
    };
    fields.name = 1;
    fields.regression = 1;
    vy.fetch('scenario', query, {fields:fields}, callback);
  };
  
  let line_chart = function(chart_label, x_, ylist, db) {
    //x = {axis_label:'Time (sec)',data:[0,0.01,...,10.3]}
    //ylist = [
    //  {axis_label:'L (m)', sets:[{set_label:'set1':data:[1,2.1,...,0.1]},{label:'set2':data:[0.01,-.1,...,3.2]}]
    //  {axis_label:'w (m)', sets:[{set_label:'z':data:[1.3,2.1,...,0.1]}
    //];
    var count = 0;
    var yAxes = [];
    var datasets = [];
    for (var jj=0; jj<ylist.length; jj++) {
      yAxes.push({
        id: jj+'',
        type: 'linear',
        position: 'left',
        scaleLabel: {display: true, labelString: ylist[jj].axis_label}
      });
      for (var kk=0; kk<ylist[jj].sets.length; kk++) {
        var y = ylist[jj].sets[kk];
        var n = y.data.length;
        var x = x_.data;
        if (y.hasOwnProperty('x')) x = y.x;
        
        if (x.length !== n) {
          console.log('Data length for y data "'+y.set_label+'" does not match length of x data');
          continue;
        }
        
        var d = [];
        for (var ii=0; ii<n; ii++) {
          d.push({x:x[ii], y:y.data[ii]});
        }
        var c =colors[count % colors.length].replace(':',1);
        datasets.push({
          label:y.set_label, 
          yAxisID:jj+'', 
          data:d,
          fill:false,
          pointRadius: 0,
          backgroundColor: c,
          borderColor: c
        });
        count++;
      }
    }
    var chart = {
      type:'line', 
      data:{ datasets:datasets }, 
      options: {
        responsive: true,
        animation: {duration: 0}, // general animation time
        hover: {animationDuration: 0}, // duration of animations when hovering an item
        responsiveAnimationDuration: 0, // animation duration after a resize
        elements: {line: {tension: 0}}, // disables bezier curves
        scales: {
          yAxes: yAxes,
          xAxes: [{
            type: "linear",
            scaleLabel: {display: true, labelString: x_.axis_label}
          }]
        }
      }
    };
    db.upsert({
      '#tag':'chartjs',
      window:'chart_label',
      name:chart_label,
      data:chart
    });
  };
  
  return {
    analysis_chart:analysis_chart,
    line_chart:line_chart
  }
})();