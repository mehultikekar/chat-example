require('date-format-lite') // overrides default Date class
function time_str() {
  var now = new Date()
  return now.format("H:mm A, DDD MMM D")
}

var fs = require('fs')
function read_ssl (f) {
  return fs.readFileSync(__dirname + '/ssl/' + f)
}

var log = console.log
console.log = function() {
  log.call(console, time_str())
  log.apply(console, arguments);
}

var ssl_opts = {
  key: read_ssl('cayenne.mit.edu.key'),
  cert: read_ssl('cayenne_mit_edu.cer'),
  ca: read_ssl('mit_client.crt'),
  crl: read_ssl('mit_client.crl'),
  requestCert: true,
  rejectUnauthorized: false
}

var app = require('express')()
  , gzip = require('connect-gzip')
  , https = require('https').createServer(ssl_opts, app)
  , io = require('socket.io')(https)
  , md = require('./md')


// http authentication middleware
app.use(function(req, res, next) {
  if (req.client.authorized) {
    next()
  }
  else {
    res.writeHead(401, {"Content-Type": "text/html"})
    fs.readFile(__dirname + '/dist/401.html', function (err, data) {
      if (err) throw err
      else res.end(data)
    })
  }
})

// for serving static resources
app.use(gzip.staticGzip(__dirname + '/dist', {matchType: /text|javascript|svg/}))

// socket authentication middleware
io.use(function(socket, next) {
  var req = socket.request
  if (req.client.authorized) {
    var cert = req.connection.getPeerCertificate().subject
    socket.user_id = cert.emailAddress.split('@')[0]
    socket.user_name = cert.CN
    next()
  }
})

var names = {}

io.on('connection', function(socket){
  var id = socket.id
    , name = socket.user_name

  console.log(name, "has connected from", socket.client.conn.remoteAddress)
  names[id] = name
  console.log(names)

  // tell client its id and all names
  socket.emit('id', {id:id, names:names})

  // tell others about it
  socket.broadcast.emit('new', {id:id, name:name})

  socket.on('chat message', function(msg){
    if (! /^\s*$/.test(msg))
      io.emit('chat message', {
        id:id,
        msg:md.render(msg),
        md:msg,
        time:time_str()
      })
  })

  socket.on('disconnect', function() {
    delete names[id]
    console.log("Disconnected from", name)
    console.log(names)
    io.emit('left', id)
  })
})

https.listen(8443, function(){
  console.log('listening on *:8443')
})
