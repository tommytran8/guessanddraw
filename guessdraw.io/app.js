var express = require('express');
var app = express();
const http = require('http').Server(app);
var socket = require('socket.io');
const io = require('socket.io')(http);
var user = {};
var usercorrect = [];
var i = 1;
var currentStroke = "black";
var strokeSize = 3;
var currentWord = Math.floor(Math.random() * 62);
var currentTime = 0;
var firstCountdown = null;
var stateholder;
var uptodatecanv = null;

app.use(express.static('static'));
app.get('/', (req,res)=>{ 
    res.sendFile('index.html');
});

io.on('connection', (socket) => { //gets emitted connection and does things
    console.log('a user connected:' + socket.id);
    user[socket.id] = "user" + i;
    i += 1;
    io.emit('chat message', null, user[socket.id] + ' has connected.');

    //keeps playerlist updated
    io.emit('update players', user, usercorrect);

    io.emit('stroke color', currentStroke);

    io.emit('pixelsize', strokeSize);
    
    io.emit('change word', currentWord, null);

    io.emit('current time', currentTime);

    io.emit('start countdown', firstCountdown, null);

    io.emit('getupdate', uptodatecanv);

    //gets message from one user and sends (emits) to the everyone
    socket.on('chat message', (msg) => {
      io.emit('chat message',  user[socket.id], msg);
    });

  
    socket.on('set stroke color', (color)=>{
      currentStroke = color;
      io.emit('stroke color', color);
    });
    socket.on('set pixelsize', (size)=>{
      strokeSize = size;
      io.emit('pixelsize', size);
    });

    socket.on('drawing', (x1,y1,x2,y2)=>{
      io.emit('drawing', x1,y1,x2,y2);
    });
    socket.on('clear', ()=>{
      io.emit('clear');
    });

    socket.on('guessed correctly',()=>{
      usercorrect.push(user[socket.id]);
      io.emit('correct', usercorrect);
    });
    socket.on('change word', ()=>{
      currentWord = Math.floor(Math.random() * 62);
      io.emit('change word', currentWord, usercorrect); //random int 0-61
      usercorrect = [];
    });

    socket.on('current timer', (time)=>{
      currentTime = time;
      io.emit('current time', time);
    });

    socket.on('set countdown', (state)=>{
      firstCountdown = state;
      stateholder = user[socket.id];
    });

    socket.on('update', (canvas)=>{
      uptodatecanv = canvas;
    });
    // socket.on('getupdate', ()=>{
    //   if (uptodatecanv != null){io.emit('getupdate', uptodatecanv);}
    // });

    socket.on('disconnect', () => {
      //prints to chat user# has disconnected
      io.emit('chat message', null ,user[socket.id] + ' has disconnected.');

      //removed user# from playerlist and it's html object.
      io.emit('delete player', user[socket.id] );

      //this is so that even if the host leaves, the game will continue running
      if (stateholder == user[socket.id] && Object.keys(user).length != 1){
        var temp;
        while ( user[socket.id] == stateholder){
          temp = Object.keys(user)[Math.floor(Math.random() * Object.keys(user).length)];
          stateholder = user[temp];
        }
        io.to(temp).emit('start countdown', null, firstCountdown);
      } 
     
      for (var i = 0; i < usercorrect.length; i++){
        if (usercorrect[i] == user[socket.id]){
            usercorrect.splice(i, 1);
            break;
        }
      }
      //removes user# from user object
      delete user[socket.id];

    
      if (Object.keys(user).length == 0){
        //default settings
        console.log("NEW GAME")
        i = 1;
        currentStroke = "black";
        strokeSize = 3;
        currentWord = Math.floor(Math.random() * 62);
        currentTime = 0;
        firstCountdown = null;
        stateholder = null;
        uptodatecanv = null;
      }
    });
});
http.listen(3000, () => {
  console.log('listening on *:3000');
});