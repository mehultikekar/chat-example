var inactive = true; // if tab is not in focus

window.onfocus = function () {inactive = false;};
window.onblur = function () {inactive = true;};

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

var socket = io();
var id = -1;
var names = {};

function addPerson (i) {
  $('#names').append($('<li>', {"id": i, "text": names[i] + (i == id? "(me)": "")}));
}
function addInfo (info) {
  $('#messages').append($('<li>', {"class": "info", "text": info}));
}

// add new message to page
var queue = MathJax.Hub.queue;
function addMesg(msg) {
  var bottom = atBottom();
  var n = (id == msg.id? 'me': names[msg.id]) + ':';
  $('#messages').append($('<li>', {
      "class": "info",
      "html": n + "<span class=time>" + msg.time + "</span>"
  }));

  var li = document.createElement('li');
  li.className = "message";
  li.innerHTML = mdHtml.render(html_sanitize(msg.msg));
  var v = $(li);
  v.find('a').attr('target', '_blank');
  $('#messages').append(v);

  if (bottom || (msg.id == id)) {scrollDown();}
  queue.Push(["Typeset", MathJax.Hub, li]);
  if (bottom || (msg.id == id)) {queue.Push([scrollDown]);}
  return bottom;
}

// all the events
// send message
$('form').submit(function(){
  var msg = $('#message').val();
  socket.emit('chat message', msg);
  $('#message').val('');
  return false;
});

// receive message
socket.on('chat message', function(msg){
  var bottom = addMesg(msg);
  if ((inactive || !bottom) && (msg.id != id)) {document.getElementById('ping').play();}
});

socket.on('id', function(msg) {
    id = msg.id;
    names = msg.names;
    addInfo("You have joined as " + names[id]);
    $('#names').text('');
    for (i in msg.names) {addPerson(i);}
});

// update list of connected people
socket.on('new', function(msg) {
    names[msg.id] = msg.name;
    addInfo(msg.name + " has joined");
    addPerson(msg.id);
});

socket.on('left', function(i) {
    var n = names[i];
    addInfo(n + " has left");
    delete names[i];
    document.getElementById('names').querySelector('#'+i).remove();
});

socket.on('disconnect', function() {
  addInfo("You went offline");
  $("#names").text("(you are offline)");
});
