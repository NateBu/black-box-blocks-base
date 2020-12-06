export function load_then_execute(urls, execute_this_when_all_urls_loaded) {
  let loadf = function () {
    if (urls.length > 0) {
      var script = document.createElement('script');
      script.src = urls.splice(0,1);
      script.onload = loadf;
      document.head.appendChild(script); //or something of the likes
    } else {
      execute_this_when_all_urls_loaded();
    }
  };
  loadf();
};