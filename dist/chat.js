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

var d_byId = function (id) {return document.getElementById(id)}
  , d_messages = d_byId('messages')
  , d_names = d_byId('names')
  , d_ping = d_byId('ping')
  , d_input = d_byId('message')

function d_elem(tag, attrs, text) {
  attrs = attrs || {}
  var elem = document.createElement(tag)
  for (attr in attrs) elem.setAttribute(attr, attrs[attr])
  if (text) elem.textContent = text
  return elem
}

function addPerson (i) {
  d_names.appendChild(d_elem('li', {id: i}, names[i] + (i == id? ' (me)': '')))
}

function addInfo (info) {
  d_messages.appendChild(d_elem('li', {class: 'info'}, info))
}

// all the events
// send message
document.forms[0].onsubmit = function(){
  socket.emit('chat message', d_input.value)
  d_input.value = ''
  return false
}

// receive message
socket.on('chat message', function(msg){
  var bottom = atBottom(0)
    , n = (id == msg.id? 'me': names[msg.id]) + ':'

  // sender name and time
  var elem = d_elem('li', {class: 'info'}, n)
  elem.appendChild(d_elem('span', {class: 'time'}, msg.time))
  d_messages.appendChild(elem)

  // actual message. click to toggle display of original markdown
  var elem = d_elem('li', {class: 'message', title: msg.md})
  elem.innerHTML = msg.msg
  elem.onclick = function() {
    var bottom = atBottom(10)
      , md = this.nextElementSibling.style

    md.display = md.display === ''? 'none': ''
    if (bottom) scrollDown()
  }
  d_messages.appendChild(elem)

  // original markdown
  var elem = d_elem('li', {class: 'md'})
  elem.style.display = 'none'
  elem.appendChild(d_elem('pre', {}, msg.md))
  d_messages.appendChild(elem)

  if ((inactive || !bottom) && (msg.id != id))
    d_ping.play()
  else
    scrollDown()
})

socket.on('id', function(msg) {
  id = msg.id
  names = msg.names
  addInfo('You have joined as ' + names[id])
  d_names.textContent = ''
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
    d_names.querySelector('#'+i).remove()
})

socket.on('disconnect', function() {
  addInfo('You went offline')
  d_names.textContent = '(you are offline)'
})
