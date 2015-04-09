var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dns = require('dns');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var names = {}
function get_names() {
    return Object.keys(names).map(function (key) {return names[key];})
}

app.use(require('express').static(__dirname + '/node_modules'));

io.on('connection', function(socket){
  var addr = socket.client.conn.remoteAddress.split(':');
  addr = addr[addr.length - 1];
  var id = socket.id;

  dns.reverse(addr, function (err, domains) {
      var name = (err == null)? (domains[0].split('.')[0]) : addr;
      socket.emit('name', name, function(new_name) {
          names[id] = new_name;
          console.log("Renamed", addr, "to", new_name);
          io.emit('names', get_names());
          socket.broadcast.emit('update', new_name + ' has connected.');
      });
  });

  socket.on('chat message', function(msg){
    socket.broadcast.emit('chat message', {name:names[id], msg:msg});
  });

  console.log("New connection from", addr);

  socket.on('disconnect', function() {
    var name = names[id];
    delete names[id];
    console.log("Disconnected from", name);
    io.emit('names', get_names());
    io.emit('update', name + ' has disconnected.');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
