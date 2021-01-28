window.onload=function() {
    var state;
    guessedcorrectly = false; 
    turnindex = 0;
    messages = document.getElementById('chatbox');
    const form = document.getElementById('form');
    input = document.getElementById('input');
    const trash = document.getElementById('trash');
    players = document.getElementById('players');
    colors =  document.getElementById('colors');
    pixelsizes=document.getElementById('pixelsizes');
    timer = document.getElementById('time');
    currentWord = document.getElementById('currentword');
    let savedWord;
    playerlist = [];
    words = ["bike","cloud","square","snowman","ice cream cone","box",
        "head","bunny","tail","pillow", "duck","mouth","cat","key","worm",
        "bumblebee","window","arm","diamond","spider","bed","blanket",
        "cupcake","lizard","angel","cow","man","zoo","boat","apple","legs",
        "eagle","fur","pine","tree","rice","thermometer","wave","celery",
        "crust","magazine","magnet","scissors","wheelbarrow","bathtub",
        "sidewalk","drumstick","rug","shake","basket","juice","grandma",
        "propose","knight","glitter","trapped","hermit crab","postcard",
        "cabin","police","carpenter","ginger"];
    socket = io(); // emit 'connection' to server from cilent socket
    let xx = 0;
    let yy = 0;
    isDrawing = false;
    canv= document.getElementById("canvas");
    display=canv.getContext("2d");
    clearScreen();
    setup();

}

function setup(){

    //button to enter into players' chat
    form.addEventListener('submit', (e)=> {
        e.preventDefault();
        if (input.value && !guessedcorrectly) {
            //this is guessing correct word
            if (input.value.trim() == savedWord){
                socket.emit("guessed correctly");

                //only sends to the user that guesses correctly
                var item = document.createElement('p');
                item.textContent = "You guessed correctly!";
                messages.appendChild(item);
                guessedcorrectly = true;
            }
            else{
                //sends message to server (this is talking normally in chat)
                socket.emit('chat message', input.value);
            }
        }
        input.value = '';
    });

    colors.childNodes.forEach(color => {
        color.addEventListener('click', ()=>{
            socket.emit('set stroke color', color.id, turnindex);
        }); 
    });
    pixelsizes.childNodes.forEach(size => {
        size.addEventListener('click', ()=>{
            if (size.id == "small"){
                socket.emit('set pixelsize', 3, turnindex);
            }
            else if(size.id == "medium"){
                socket.emit('set pixelsize', 6, turnindex);
            }
            else if(size.id == "large"){
                socket.emit('set pixelsize', 9, turnindex);
            }
        }); 
    });
    //button to clear canvas with drawing, updates all players' screen
    trash.addEventListener('click', ()=>{
        socket.emit('clear', turnindex, false);
    });
    

    //updates everyone's chat with (user: message) with message from server
    socket.on('chat message', (player,msg)=> {
        var item = document.createElement('p');
        if (player == null){
            item.textContent = msg;
            messages.appendChild(item);
        }
        else{
            item.textContent = player + ": " + msg;
            messages.appendChild(item);
        }
        
    });

    socket.on('pixelsize', (size)=>{
        display.lineWidth = size; //sets size of strokes
    });
    socket.on('stroke color', (color)=>{
        display.strokeStyle = color;
    });

    //updates drawing on all players' canvas
    socket.on('drawing', (x1,y1,x2,y2)=>{
        drawLine(x1, y1, x2, y2);
    });

    socket.on('drawer' , ()=>{
        guessedcorrectly = true;
    });

    //clear all players' canvas with drawing
    socket.on('clear', ()=>{
        clearScreen();
    });

    socket.on('correct', (conIDs)=>{
        conIDs.forEach(element => {
            if(document.getElementById("check" + element) == undefined){
                addCheckMark(element);
            }
        });
        if (conIDs.length >= playerlist.length-1){
            socket.emit('clear', conIDs[conIDs.length-1], true);
            socket.emit('current timer', "1", turnindex);
            //socket.emit('update score'); NEED SCORING
        }
    });

    //updates visual and backend on players.
    socket.on('update players', (pObj, correctpObj)=>{
        Object.values(pObj).forEach(player => {
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
        //this is checking ALL players, so need to be careful of duplicate check marks
        //sets check marks for new incoming players
        if (correctpObj){
            correctpObj.forEach(player=>{
                if (document.getElementById("check" + player) == undefined){
                    addCheckMark(player); 
                }
            });
        }
    });

    //removes player from visual and playerlist
    socket.on('delete player', (player)=>{
        for (var i = 0; i < playerlist.length; i++){
            if (player == playerlist[i]){
                playerlist.splice(i, 1);
                break;
            }
        }
        document.getElementById(player).remove();
        if (turnindex > 0){
            turnindex -= 1;
        }
        if (playerlist.length <= 0){
            turnindex = 0;
            clearInterval(state);
        }
    });
    
    socket.on('checking if drawer', (idx)=>{
        socket.emit('checking if drawer', idx, turnindex);
    });

    socket.on('change word', (wIndex, users, turn)=>{
        let tempWord = "_";
        for (let i = 1; i < words[wIndex].length; i++){
            console.log(words[wIndex].charAt(i));
            if (words[wIndex].charAt(i) != ' '){
                tempWord = tempWord +  " _";
            }
            else{ tempWord = tempWord +  " - ";}
        }
        savedWord = words[wIndex];
        currentWord.innerHTML = tempWord;
        if (users){
            users.forEach(element => {
                document.getElementById("check" + element).remove();
            });
        }
        if(turn != null){
            socket.emit("set drawer's word", turn, words[wIndex]);
            socket.emit('set turn', turn);
            guessedcorrectly = false; //might add to set turn
        }
    });

    socket.on('set turn', (turn)=>{
        turnindex = turn;
    });
    socket.on("set drawer's word", (word)=>{
        currentWord.innerHTML = word;
    });
    socket.on('current time', (time, turn)=>{
        timer.innerHTML = time;
        if(turn != null){
            turnindex = turn;
        }
    });

    socket.on('start countdown', (e, inpState)=>{
        if (e == null){
            if (inpState == null){
                state = setInterval(countdown, 1000); //countdown every 1s
                socket.emit('set countdown', state);
            }
            else{
                clearInterval(inpState);
                state = setInterval(countdown, 1000); //countdown every 1s
                socket.emit('set countdown', state);
            }
        }
    });

    socket.on('getupdate', (dataUrl)=>{
        if (dataUrl != null){
            var tempImage = new Image;
            tempImage.src = dataUrl;
            tempImage.onload = function(){
                display.drawImage(tempImage,0,0);
            }
        }
    });


    //mouse events for drawing
    canv.addEventListener('mousedown', (e)=>{
        xx = e.offsetX;
        yy = e.offsetY;
        isDrawing = true;
        socket.emit('drawing', xx, yy, xx+1,yy, turnindex);
    }, true);
    canv.addEventListener('mousemove', (e)=>{
        if (isDrawing === true) {
            socket.emit('drawing', xx, yy, e.offsetX, e.offsetY, turnindex);
            xx = e.offsetX;
            yy = e.offsetY;
        }
    }, true);
    window.addEventListener('mouseup', (e)=>{
        if (isDrawing === true) {
            xx = 0;
            yy = 0;
            isDrawing = false;
            socket.emit('update', canv.toDataURL("image/png"));
          }
    }, true);

}

function drawLine(x1, y1, x2, y2) {   
        display.beginPath();       // Start a new path
        display.moveTo(x1, y1);    // set where the pen starts
        display.lineTo(x2, y2);  // Draw a line to (offsetX, offsetY)
        display.stroke();  //render the path
          
        // i = x1 < x2 ? x1 : x2;

}

function clearScreen() {
    display.fillStyle="lightyellow"; 
    display.fillRect(0,0,canv.width,canv.height);
};

function countdown(){
    if (timer.innerHTML == "0"){
        socket.emit('change word', turnindex);
        socket.emit('current timer', "60", turnindex);
    }
    else{
        socket.emit('current timer', (parseInt(timer.innerHTML) - 1).toString(), turnindex);
    }
}

function addCheckMark(conID){
    var img = document.createElement('img');
    img.src = "../assets/checkmark.png";
    img.id = "check" + conID;
    document.getElementById(conID).appendChild(img);
    console.log(document.getElementById("check" + conID));
}