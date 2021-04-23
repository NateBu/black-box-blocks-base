const TWOPI = 2*Math.PI;
export function control_panel(canvas, SWARM, CONFIG) {
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let map_radius = Math.min(canvas.width,canvas.height)/2-5;
  let x0 = map_radius+5, y0 = canvas.width-(map_radius+5);
  ctx.beginPath();
  ctx.arc(x0, y0, map_radius, 0, TWOPI);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
  SWARM.forEach(bot => {
    let sw = CONFIG.swarms_config[bot.swarm_id];
    ctx.beginPath();
    let x = x0 + bot.state.x * map_radius/CONFIG.arena_size;
    let y = y0 - bot.state.y * map_radius/CONFIG.arena_size;
    ctx.arc(x, y, 4, 0, TWOPI);
    ctx.stroke();
    ctx.fillStyle = sw.rgbs;
    ctx.fill();
  })
}
