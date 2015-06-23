var inactive = true
  , socket = io()
  , id = -1
  , names = {}

window.onfocus = function () {inactive = false}
window.onblur = function () {inactive = true}

// convenience functions
function scrollDown () {
  window.scrollTo(0, document.body.scrollHeight)
}

function atBottom(margin) {
  return (window.innerHeight + window.scrollY + margin) >= document.body.offsetHeight
}

function addPerson (i) {
  $('#names').append($('<li>', {id: i, text: names[i] + (i == id? ' (me)': '')}))
}

function addInfo (info) {
  $('#messages').append($('<li>', {class: 'info', text: info}))
}

function li (className, html) {
  return $('<li>', {class: className, html: html})
}

// add new message to page
function addMesg(msg) {
  var bottom = atBottom(0)
    , n = (id == msg.id? 'me': names[msg.id]) + ':'

  $('#messages').append(li('info', n + '<span class=time>' + msg.time + '</span>'))

  var m = li('message', msg.msg).attr('title', msg.md)
  m.find('a').attr('target', '_blank')
  m.click(function () {
    var bottom = atBottom(10)
    $(this).next().toggle()
    if (bottom) scrollDown()
  })
  $('#messages').append(m)

  var md = li('md', '<pre>' + msg.md + '</pre>')
  md.css({display: 'none'})
  $('#messages').append(md)

  if (bottom || (msg.id == id)) scrollDown()
  return bottom
}

// all the events
// send message
$('form').submit(function(){
  var msg = $('#message').val()
  socket.emit('chat message', msg)
  $('#message').val('')
  return false
})

// receive message
socket.on('chat message', function(msg){
  var bottom = addMesg(msg)
  if ((inactive || !bottom) && (msg.id != id)) document.getElementById('ping').play()
})

socket.on('id', function(msg) {
  id = msg.id
  names = msg.names
  addInfo('You have joined as ' + names[id])
  $('#names').text('')
  for (i in msg.names) addPerson(i)
})

// update list of connected people
socket.on('new', function(msg) {
  names[msg.id] = msg.name
  addInfo(msg.name + ' has joined')
  addPerson(msg.id)
})

socket.on('left', function(i) {
    var n = names[i]
    addInfo(n + ' has left')
    delete names[i]
    document.getElementById('names').querySelector('#'+i).remove()
})

socket.on('disconnect', function() {
  addInfo('You went offline')
  $('#names').text('(you are offline)')
})
