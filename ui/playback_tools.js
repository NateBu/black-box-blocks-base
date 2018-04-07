playback = {
  playback_:{isplaying:true,percent:0,rate:1},

  playback_rate:function(rate) {
    this.playback_.rate = rate;
  },
  
  playback_isplaying:function(isplaying) {
    this.playback_.isplaying = isplaying;
    return isplaying;
  },
  
  playback_percent:function(percent) {
    this.playback_.percent = percent;
  },
  
  replay:function(parent,dataname,data_handler) {
    // data must have a time array (e.g. data.time = [0,0.1,0.2,...])
    // The index of the time will be passed back to data_handler
    var dt = 0.05; // (sec) 20 hz
    var self = this;
    var data = parent[dataname];
    if (!data.hasOwnProperty('time')) {
      console.log('Load a scenario before trying to playback!');
      x3.set_playback_isplaying(false);
      return;
    }
    var n = data.time.length;
    if (n<1) return;
    var prcnt = Math.max(0,Math.min(1,self.playback_.percent));
    var ii = Math.round(prcnt*(n-1));
    var t_total = data.time[n-1]-data.time[0];
    setTimeout(function() {
      parent[data_handler](ii);
      if (self.playback_.isplaying && prcnt<1 && n>1) {
        self.playback_.percent += (dt/t_total)*self.playback_.rate;
        x3.set_playback_percent(self.playback_.percent);
        self.replay(parent,dataname,data_handler);
      } else if (self.playback_.isplaying) {
        x3.set_playback_isplaying(false);
      }
    },dt*1000)
  }
}