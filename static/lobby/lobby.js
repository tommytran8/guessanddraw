/*after host clicks start, enter everyone into game */
const form = document.getElementById("lobby");
let players = document.getElementById("lobbylist"); 
socket = io();
playerlist = []; 
myuser = null;

form.addEventListener('submit', (e)=>{
    e.preventDefault();
    socket.emit('start game', myuser);
});

socket.on('set myuser', (user)=>{
    myuser = user;
});

socket.on('start game', ()=>{
    window.location.replace("../game/game.html");
});

//updates visual of lobby
socket.on('set lobby', (plist)=>{
    plist.forEach(player => {
        //newer players will create all players in list
        //older players will only add newer players in list
        if (!playerlist.includes(player)){
            var container = document.createElement("div");
            var item = document.createElement('p');
            container.id = player;
            item.textContent = player;
            container.appendChild(item);
            players.appendChild(container);
            playerlist.push(player);
        }
    });
});