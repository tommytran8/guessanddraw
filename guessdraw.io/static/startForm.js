const startlobby = document.getElementById("startlobby");

startlobby.addEventListener('submit', (e)=>{
    e.preventDefault();
    window.location.replace("./indexLobby.html");
});