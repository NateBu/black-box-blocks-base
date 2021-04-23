import { VY } from '/vybase/VY.js';

export function setup_vyd3(call_ui_method, get_window_size, parentNode) {

  let vyd3 = {
    xScale:null,
    yScale:null,
    xAxis:null,
    yAxis:null,
    xAxisMinor:null,
    yAxisMinor:null,
    zoomy:null,
    zoom:null,
    svg:null,
    zoomable:true
  };

  vyd3.refresh = function() {
    // Refresh axes
    if (!vyd3.svg) return;
    vyd3.svg.select(".x.axis.major").call(vyd3.xAxis).selectAll(".tick text")
      .attr('transform',"translate(0,-15)").style("text-anchor","start");
    vyd3.svg.select(".y.axis.major").call(vyd3.yAxis).selectAll(".tick text")
      .attr('transform',"translate(5,-10)").style("text-anchor","start");
    vyd3.svg.select(".x.axis.minor").call(vyd3.xAxisMinor);
    vyd3.svg.select(".y.axis.minor").call(vyd3.yAxisMinor);
    //draw_polylines(polylines);
    call_ui_method('d3_draw',{
      svg:vyd3.svg,
      xScale:vyd3.xScale,
      yScale:vyd3.yScale
    });
  }

  VY.on_reload(vyd3.refresh);

  VY.on_publish( 'd3_redraw', function(data) {
    let svg = d3.select(vyd3.d3svg);
    let w = parseInt(svg.attr('width'));
    let h = parseInt(svg.attr('height'));
    if (w <= 0 || h <= 0) return
    redraw(vyd3, w, h, data.xlow, data.xhigh, data.ylow, data.yhigh);
  });


  let resize = function(vyd3,width,height) {
    d3.select(vyd3.d3svg).attr('width',width).attr('height',height);
    vyd3.svg.select("#rectgrid").attr('width',width).attr('height',height);
    vyd3.svg.select("#mouseloc").attr('x',width-10);
    vyd3.xAxis.tickSize(height);
    vyd3.yAxis.tickSize(-width);
    vyd3.xAxisMinor.tickSize(height);
    vyd3.yAxisMinor.tickSize(-width);
    var xs = vyd3.xScale.domain();
    var ys = vyd3.yScale.domain();
    redraw(vyd3, width, height, xs[0], xs[1], ys[0], ys[1]);
  }

  let redraw = function(vyd3, width, height, xlow, xhigh, ylow, yhigh) {
    if (xlow >= xhigh || ylow >= yhigh) return;
    var ar = width/height;
    if (ar < (xhigh-xlow)/(yhigh-ylow)) {   // scale y a bit
      var dy =(xhigh-xlow)/ar;
      var yc = (ylow+yhigh)/2;
      ylow = yc - dy/2;
      yhigh = yc + dy/2;
    } else {                                // scale x a bit
      var dx =(yhigh-ylow)*ar;
      var xc = (xlow+xhigh)/2;
      xlow = xc - dx/2;
      xhigh = xc + dx/2;
    }
    vyd3.xScale.domain([xlow, xhigh]);
    vyd3.yScale.domain([ylow, yhigh]);
    vyd3.xScale.range([0,width]);
    vyd3.yScale.range([height,0]);
    vyd3.zoomy.x(vyd3.xScale).y(vyd3.yScale);
    vyd3.refresh();
  }
  let first = true;
  let load = function() {
    if (parentNode.offsetWidth === 0 || first) {
      first = false;
      console.log('vyd3.js waiting to render')
      setTimeout(load,1000); // wait til loaded
      return;
    }
    vyd3.id = 'vyd3'+Math.random().toString(36).slice(2);
    const html = `
    <div class="vyd3" id="${vyd3.id}" style="position:relative;top:0px;left:0px;pointer-events:auto">
      <svg class="topsvg" tabindex="0" focusable="true"></svg>
      <div style="position:absolute;top:20px;right:10px;">
        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-danger panzoom">
            <i class="fa fa-arrows"></i>
          </button>
        </div>
      </div>
    </div>`;
    parentNode.insertAdjacentHTML('beforeend', html);

    vyd3.d3top = parentNode.querySelector('#'+vyd3.id);
    vyd3.d3svg = vyd3.d3top.querySelector('.topsvg');

    let wh = get_window_size();
    vyd3.drag = d3.behavior.drag().on("drag", function(d,i) {});
    vyd3.xScale = d3.scale.linear().domain([-wh.width / 4, wh.width / 4]).range([0, wh.width]);
    vyd3.yScale = d3.scale.linear().domain([-wh.height / 4, wh.height / 4]).range([wh.height, 0]);
    vyd3.xAxis = d3.svg.axis().scale(vyd3.xScale).orient("bottom").ticks(5).tickSize(wh.height);
    vyd3.yAxis = d3.svg.axis().scale(vyd3.yScale).orient("left").ticks(5).tickSize(-wh.width);
    vyd3.xAxisMinor = d3.svg.axis().scale(vyd3.xScale).orient("bottom").ticks(25).tickSize(wh.height);
    vyd3.yAxisMinor = d3.svg.axis().scale(vyd3.yScale).orient("left").ticks(25).tickSize(-wh.width);
    vyd3.zoomy = d3.behavior.zoom();
    vyd3.zoom = vyd3.zoomy.x(vyd3.xScale).y(vyd3.yScale).scaleExtent([.00001, 10000]).on("zoom", function() { vyd3.refresh() });

    d3.select(vyd3.d3svg).selectAll("*").remove();
    vyd3.svg = d3.select(vyd3.d3svg).attr({width:wh.width,height:wh.height,class:'d3'}).append("g").call(vyd3.zoom);
    vyd3.svg.append("rect").attr({id:'rectgrid',width:wh.width,height:wh.height,fill:'rgba(255,255,255,.6)',class:'_grid'}).call(vyd3.drag);
    vyd3.svg.append("g").attr("class", "x axis major _grid").call(vyd3.xAxis);
    vyd3.svg.append("g").attr("class", "y axis major _grid").call(vyd3.yAxis);
    vyd3.svg.append("g").attr("class", "x axis minor _grid").call(vyd3.xAxisMinor);
    vyd3.svg.append("g").attr("class", "y axis minor _grid").call(vyd3.yAxisMinor);

    // 2. Dynamic text with mouse move
    // vyd3.svg.append("text").attr({id: "mouseloc", x: wh.width-10, y: 15,'text-anchor':'end'}).text('');

    // d3.select(vyd3.d3svg).on("mousemove", function(e) {
    //   var coords = d3.mouse(this);
    //   d3.select(`#${vyd3.id} #mouseloc`).text('x='+vyd3.xScale.invert(coords[0]).toFixed(2)+' y='+vyd3.yScale.invert(coords[1]).toFixed(2));
    //   //let canZoom = vyd3.d3top.querySelector('button.panzoom').classList.contains('btn-danger');
    //   //if (!canZoom) return;  // Don't drag if panzoom is enabled
    //   call_ui_method("d3_mousemove", {this:this,zoomable:vyd3.zoomable});
    // });

    d3.select(vyd3.d3svg).on('keydown', function(d,i) {
      d3.event.stopPropagation();
      call_ui_method("d3_keydown",d3.event.keyCode);
    })

    d3.select(vyd3.d3svg).on('keyup', function(d,i) {
      //d3.event.stopPropagation(); don't hijack
      call_ui_method("d3_keyup",d3.event.keyCode);
    })

    vyd3.svg.on('mousedown', function(){
      call_ui_method("d3_mousedown",this);
    });
    vyd3.svg.on('mouseup', function(){
      call_ui_method("d3_mouseup",this);
    });

    d3.selectAll(`#${vyd3.id} ._grid`).attr('visibility', 'visible');

    vyd3.refresh();

    // zoombtn has to be global?
    vyd3.d3top.querySelector('button.panzoom').addEventListener('click',function() {
      if (this.classList.contains('btn-default')) {
        this.classList.remove("btn-default");
        this.classList.add("btn-danger");
        vyd3.svg.call(vyd3.zoom);
        vyd3.zoomable = true;
        call_ui_method('d3_zoomable',true);
      } else {
        this.classList.remove("btn-danger");
        this.classList.add("btn-default");
        vyd3.svg.on('.zoom', null);
        vyd3.zoomable = false;
        call_ui_method('d3_zoomable',false);
      }
    });


    window.addEventListener('resize', function() {
      let wh = get_window_size();
      resize(vyd3, wh.width, wh.height);
    });
  };

  if (!window.hasOwnProperty('d3')) {
    var script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js";
    script.onload = load;
    document.head.appendChild(script); //or something of the likes
  } else {
    load();
  }

}