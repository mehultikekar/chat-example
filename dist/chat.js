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
  var bottom = atBottom(0)
    , n = (id == msg.id? 'me': names[msg.id]) + ':'

  $('#messages').append(
    $('<li>', {class: 'info', text: n}).append(
      $('<span>', {class: 'time', text: msg.time})
    ),

    $('<li>', {class: 'message', html: msg.msg, title: msg.md}).click(
      function() {
        var bottom = atBottom(10)
          $(this).next().toggle()
          if (bottom) scrollDown()
      }),

    $('<li>', {class: 'md'}).css({display: 'none'}).append(
      $('<pre>', {text: msg.md})
    )
  )

  if ((inactive || !bottom) && (msg.id != id))
    document.getElementById('ping').play()
  else
    scrollDown()
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
