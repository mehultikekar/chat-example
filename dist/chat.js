var inactive = true; // if tab is not in focus
function onBlur() {
  inactive = true;
};
function onFocus(){
  inactive = false;
};

if (/*@cc_on!@*/false) { // check for Internet Explorer
  document.onfocusin = onFocus;
  document.onfocusout = onBlur;
} else {
  window.onfocus = onFocus;
  window.onblur = onBlur;
}

// markdown setup
var mdHtml = window.markdownit({
  html: true, linkify: true, typographer: true
}).use(window.markdownitEmoji);

mdHtml.renderer.rules.emoji = function(token, idx) {
  return window.twemoji.parse(token[idx].content);
};

// convenience functions
function scrollDown () {window.scrollTo(0, document.body.scrollHeight);}
function atBottom() {return (window.innerHeight + window.scrollY) >= document.body.offsetHeight;}

// add new message to page
var queue = MathJax.Hub.queue;
function addMesg(msg) {
  var bottom = atBottom();
  $('#messages').append($('<li>', {"class": "sender", text: msg.name+':'}));

  var li = document.createElement('li');
  li.className = "message";
  li.innerHTML = mdHtml.render(html_sanitize(msg.msg));
  var v = $(li);
  v.find('a').attr('target', '_blank');
  $('#messages').append(v);

  if (bottom) {scrollDown();}
  queue.Push(["Typeset", MathJax.Hub, li]);
  if (bottom) {queue.Push([scrollDown]);}
  return bottom;
}

var socket = io();

// all the events
// send message
$('form').submit(function(){
  var msg = $('#message').val();
  socket.emit('chat message', msg);
  addMesg({name:"me", msg:msg});
  scrollDown();

  $('#message').val('');
  return false;
});

// receive message
socket.on('chat message', function(msg){
  var bottom = addMesg(msg);
  if (inactive || !bottom) {document.getElementById('ping').play();}
});

// prompt for name when server asks and send response as a socket acknowledgement
var name;
socket.on('name', function(suggested_name, fn) {
  var new_name = window.prompt("What is your name?", suggested_name);
  if (new_name == null) {new_name = suggested_name};
  name = new_name;
  fn(new_name);
});

// update list of connected people
socket.on('names', function(names) {
  var my_idx = names.indexOf(name);
  if (my_idx != -1) {
    names[my_idx] = name + '(me)';
  }
  $('#names').text(names);
});

// add message from server e.g. person connected/disconnected
socket.on('update', function(msg) {
  $('#messages').append($('<li>', {"class": "sender", text: msg}));
  if(!atBottom()) {scrollDown();}
});

socket.on('disconnect', function() {
  $("#names").text("(you are offline)");
});
