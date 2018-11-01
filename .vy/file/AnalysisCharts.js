var colors = ['rgba(255,0,0,:)',
  'rgba(255,127,0,:)',
  'rgba(255,255,0,:)',
  'rgba(127,255,0,:)',
  'rgba(0,255,0,:)',
  'rgba(0,255,127,:)',
  'rgba(0,255,255,:)',
  'rgba(0,127,255,:)',
  'rgba(0,0,255,:)',
  'rgba(127,0,255,:)',
  'rgba(255,0,255,:)',
  'rgba(255,0,127,:)'];

var get_dataset_index = function(chart, label) {
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
    backgroundColor: color.replace(':','0.5'),
    borderColor: color.replace(':','1'),
    borderWidth: 1
  });
  return n;
};

var get_data_index = function(chart, id, label) {
  var idx = chart.data.ids.indexOf(id);
  if (idx === -1) {
    chart.data.ids.push(id);
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(null);
    idx = chart.data.datasets[0].data.length-1;
  }
  return idx;
};

var add_data = function(chart, setlabel, dataid, datalabel, data) {
  var set_indx = get_dataset_index(chart, setlabel);
  var data_indx = get_data_index(chart, dataid, datalabel);
  var n = chart.data.datasets[set_indx].data.length;
  for (var ii = n; ii<data_indx+1; ii++) {
    chart.data.datasets[set_indx].data.push(null);
  }
  chart.data.datasets[set_indx].data[data_indx] = data;
};

makechart = function(yaxislabel, dataloc, rslt) {
  var chart = {
    type:'bar', 
    data:{ ids:[], labels:[], datasets:[]}, 
    options: {
      responsive: true,
      scales: {
        yAxes: [{
          scaleLabel: {display: true, labelString: yaxislabel}, 
          ticks: {beginAtZero:true}
        }],
        xAxes: [{ticks: {display:false}}]
      }
    }
  };
  // Get labels and original data set
  var baseidx = get_dataset_index(chart, 'Base');
  rslt.forEach(function(x) {
    var value = dataloc.split('.').reduce((o,i)=>(o&&o.hasOwnProperty(i))?o[i]:null, x);
    if (x.regression.id == "-") {
      chart.data.ids.push(x._id);
      chart.data.labels.push(x.name);
      chart.data.datasets[baseidx].data.push(value);
    }
  });
  
  rslt.forEach(function(x) {
    var value = dataloc.split('.').reduce((o,i)=>(o&&o.hasOwnProperty(i))?o[i]:null, x);
    if (x.regression.id !== "-") {
      var xb = new Date(x.regression.timestamp);
      var lbl = xb.toLocaleDateString() + ' ' + xb.toLocaleTimeString();
      add_data(chart, lbl, x.regression.id, x.name, value);
    }
  });
  //  console.log(JSON.stringify(chart,null,2));
  return chart;
}