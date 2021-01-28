var express = require('express');
var app = express();
const http = require('http').Server(app);
var socket = require('socket.io');
const io = require('socket.io')(http);
var userlist = [];
var user = {};
var usercorrect = [];
var i = 0;
var inLobby = true;
var currentStroke = "black";
var strokeSize = 3;
var currentWord = Math.floor(Math.random() * 62);
var currentTime = "0";
var firstCountdown = null;
var stateholder;
var uptodatecanv = null;

app.use(express.static('static'));
app.get('/', (req,res)=>{ 
    res.sendFile('index.html');
});

io.on('connection', (socket) => { //gets emitted connection and does things
    console.log('a user connected:' + socket.id);
    if (!inLobby){
      //for new player
      io.emit('start game');

      //add player to game
      if (userlist[i] != undefined){
        user[socket.id] = userlist[i];
        i += 1;

        io.emit('chat message', null, user[socket.id] + ' has connected.');
        //keeps playerlist updated
        io.emit('update players', user, usercorrect);

        io.emit('stroke color', currentStroke);

        io.emit('pixelsize', strokeSize);
        
        io.to(socket.id).emit('change word', currentWord, null, null);

        io.emit('current time', currentTime, null);

        io.emit('start countdown', firstCountdown, null);

        io.emit('getupdate', uptodatecanv);
      }
    }
    else {
      io.to(socket.id).emit('set myuser', userlist[i-1]);
      io.emit('set lobby', userlist);
    }


    socket.on('start game', (inpUser)=>{
      //if it is the host, then start game
      if (userlist[0] == inpUser){
        io.emit('start game');
        inLobby = false;
        i = 0;
      }
    });
    socket.on('add user to server', (u)=>{
      if (u){
        userlist.push(u);
      }
      else{
        userlist.push('user ' + (i+1).toString());
      }
      if (inLobby){
        i += 1;
      }
      io.to(socket.id).emit('join lobby', inLobby);
    });

    //gets message from one user and sends (emits) to the everyone
    socket.on('chat message', (msg) => {
      io.emit('chat message',  user[socket.id], msg);
    });

  
    socket.on('set stroke color', (color, turnindex)=>{
      if (Object.values(user)[turnindex] == user[socket.id]){ 
        currentStroke = color;
        io.emit('stroke color', color);
      }
    });
    socket.on('set pixelsize', (size, turnindex)=>{
      if (Object.values(user)[turnindex] == user[socket.id]){ 
        strokeSize = size;
        io.emit('pixelsize', size);
      }
    });

    socket.on('drawing', (x1,y1,x2,y2, turnindex)=>{
      if (Object.values(user)[turnindex] == user[socket.id]){ 
        io.emit('drawing', x1,y1,x2,y2);
      }
    });
    socket.on('clear', (turnindex, b)=>{
      if (Object.values(user)[turnindex] == user[socket.id] || b){ 
        uptodatecanv = null;
        io.emit('clear');
      }
    });
    socket.on("set drawer's word", (turnindex, word)=>{
      if (Object.values(user)[turnindex] == user[socket.id]){ 
        io.to(socket.id).emit("set drawer's word", word);
      }
    });
    socket.on('set turn', (turnindex)=>{
      io.emit('set turn', turnindex);
    });

    socket.on('guessed correctly',()=>{
      usercorrect.push(user[socket.id]);
      io.emit('correct', usercorrect);
    });
    socket.on('change word', (turnindex)=>{
      var turn  = turnindex;
      if (turnindex >= Object.values(user).length){
        turn = 0;
      }
      currentWord = Math.floor(Math.random() * 62);
      io.emit('change word', currentWord, usercorrect, turn); //random int 0-61
      usercorrect = [];
      currentStroke = "black";
      strokeSize = 3;
      io.emit('stroke color', currentStroke);
      io.emit('pixelsize', strokeSize);
      io.to(Object.keys(user)[turn]).emit('drawer');
      io.emit('chat message', null, Object.values(user)[turn] + " is drawing!");

    });

    socket.on('current timer', (time, turnindex)=>{
      currentTime = time;
      var turn = turnindex;
      if (time == "0"){ //change player after 0 secs and clear everyone's canvas
        turn += 1;
        io.emit('clear');
      }
      io.emit('current time', time, turn);
    });

    socket.on('set countdown', (state)=>{
      firstCountdown = state;
      stateholder = user[socket.id];
    });

    socket.on('update', (canvas)=>{
      uptodatecanv = canvas;
    });

    socket.on('checking if drawer', (idx,turn)=>{
      console.log(turn ,idx, "in checking if drawer");
      if (idx == turn){
        currentTime = "1";
        io.emit('current time', "1", turn-1); //end turn if drawer leaves
      }
    });
    

    socket.on('disconnect', () => {
      console.log('disconnected user: ' + socket.id);
      if (!inLobby && user[socket.id] != undefined){
        //prints to chat user# has disconnected
        io.emit('chat message', null ,user[socket.id] + ' has disconnected.');

        var uindex;
        for (uindex = 0; uindex < Object.values(user).length; uindex++){
          if (user[socket.id] == Object.values(user)[uindex]){
            io.emit('checking if drawer', uindex);
            break;
          }
        }
        
        //removed user# from playerlist and it's html object.
        io.emit('delete player', user[socket.id] );

        //this is so that even if the host leaves, the game will continue running
        if (stateholder == user[socket.id] && Object.keys(user).length >= 2){
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
        console.log('get to delete first');
      
        if (Object.keys(user).length <= 0){
          //default settings
          console.log("NEW GAME")
          currentStroke = "black";
          strokeSize = 3;
          currentWord = Math.floor(Math.random() * 62);
          currentTime = "0";
          firstCountdown = null;
          stateholder = null;
          uptodatecanv = null;
          user = {};
          i = 0;

          //just added these idk if needed
          usercorrect = [];
          userlist = [];
          inLobby = true;
        }
      }
    });
});
http.listen(3000, () => {
  console.log('listening on *:3000');
});