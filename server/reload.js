(function () {
  var ws = new WebSocket("ws://" + location.host + "/_bock/ws");
  ws.onmessage = function (e) {
    if (e.data === "reload") location.reload();
  };
  ws.onclose = function () {
    setTimeout(function () {
      location.reload();
    }, 1000);
  };
})();
