/* gets username in enter player into server lobby */

const form = document.getElementById("enteruser");
username = document.getElementById('username'); 
socket = io();


form.addEventListener('submit', (e)=>{
    e.preventDefault();
    // need to send username to server
    
    socket.emit('add user to server', username.value);
});
socket.on('join lobby', (bool)=>{
    if (bool){
        window.location.replace("./lobby/lobby.html");
    }
    else{
        window.location.replace("./game/game.html");
    }
});