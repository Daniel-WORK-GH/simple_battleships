var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

canvas.addEventListener('mousedown', boardClick);

var board = [];
var boardwidth = 10;
var boardheight = 10;

var ship2, ship3, ship4, ship5;

var showcase = false;

const TileWidth = 30;
const TileHeight = 30;
var MaxShips = 1;

var audio = new Audio('boom.mp3');
var boompng = new Image();
boompng.src = "boom.png";
var winpng = new Image();
winpng.src = "win.png";

const Tiles = {
    None : 0, //state of a completly empty tile
    NonePressed : 1, //state of an empty tile after clicked
    Ship : 2, //state of a tile that has a ship [hidden]
    SunkenShip : 3, //state of a tile that has a ship after click

    NoneTaken : 5, //empty tile but cannot be changed to a ship [to keep 1 tile distances]
};

const ColorLookup = {
    [Tiles.None] : "grey",
    [Tiles.NonePressed] : "blue",
    [Tiles.Ship] : "grey",
    [Tiles.SunkenShip] : "orange",
    [Tiles.NoneTaken] : "grey"
}

const ColorLookupShowcase = {
    [Tiles.None] : "grey",
    [Tiles.NonePressed] : "blue",
    [Tiles.Ship] : "green",
    [Tiles.SunkenShip] : "orange",
    [Tiles.NoneTaken] : "purple"
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

//call this when a ship was sunk
function playAnimation(){
    canvas.removeEventListener('mousedown', boardClick);
    var rect = canvas.getBoundingClientRect();

    ctx.drawImage(boompng, 0, 0, rect.width, rect.height);
    audio.play();
    setTimeout(() => {
        ctx.clearRect(0, 0, rect.width, rect.height)
        drawBoard();
        audio.pause();
        audio.currentTime = 0;
        canvas.addEventListener('mousedown', boardClick);
    }, 1000);
}

function playVictory(){
    canvas.removeEventListener('mousedown', boardClick);
    var rect = canvas.getBoundingClientRect();
    
    audio.play();
    ctx.drawImage(winpng, 0, 0, rect.width, rect.height);
}

function setMaxShips(boardsize){
    switch (boardsize) {
        case 10: MaxShips = 1; break;
        case 11: MaxShips = 1; break;
        case 12: MaxShips = 1; break;
        case 13: MaxShips = 1; break;
        case 14: MaxShips = 2; break;
        case 15: MaxShips = 2; break;
    
        default: MaxShips = 1; break;
    }
}

function restartGame(){
    //get 'get' params
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    showcase = urlParams.has('showcase');

    boardwidth = urlParams.get('size');
    boardheight = urlParams.get('size');

    //set default value
    if(!boardwidth || !boardheight){
        boardwidth = 10;
        boardheight = 10;
    }
    boardwidth = Number(boardwidth);
    boardheight = Number(boardheight);

    setMaxShips(boardwidth);

    ship2 = urlParams.get('ship2');
    ship3 = urlParams.get('ship3');
    ship4 = urlParams.get('ship4');
    ship5 = urlParams.get('ship5');

    //set default value + keep in range
    if(!ship2) ship2 = 1;
    else if(ship2 > MaxShips) ship2 = MaxShips;

    if(!ship3) ship3 = 1;
    else if(ship3 > MaxShips) ship3 = MaxShips;

    if(!ship4) ship4 = 1;
    else if(ship4 > MaxShips) ship4 = MaxShips;

    if(!ship5) ship5 = 1;
    else if(ship5 > MaxShips) ship5 = MaxShips;

    //set canvas size 
    canvas.width = boardwidth * TileWidth;
    canvas.height = boardheight * TileHeight;

    //fill board [empty]
    board = [];
    for (let i = 0; i < boardheight; i++) {
        board.push([]);
        for (let j = 0; j < boardwidth; j++) {
            board[i].push([Tiles.None]);
        }
    }

    generateShips();
}

function generateShips(){
    function checkIsValidLocation(horivert, x, y, size){
        //set start location of placemett
        let starty = y - 1;
        if(starty < 0) starty = 0;
        let startx = x - 1;
        if(startx < 0) startx = 0;

        //set end location [vertical]
        let endy = y + 1;
        if(horivert == 1) endy += size - 1
        if(endy >= boardwidth) endy = boardwidth - 1;

        //set end location [horizontal]
        let endx = x + 1;
        if(horivert == 0) endx += size - 1
        if(endx >= boardheight) endx = boardheight - 1;

        let validlocation = true;

        for (let y = starty; y <= endy; y++) {
            for (let x = startx; x <= endx; x++) {
                if(board[y][x] != Tiles.None){
                    validlocation = false;
                }
            }
        }

        return validlocation;
    }

    function placeShip(horivert, x, y, size){
        //set start location of placemett
        let starty = y - 1;
        if(starty < 0) starty = 0;
        let startx = x - 1;
        if(startx < 0) startx = 0;

        //set end location [vertical]
        let endy = y + 1;
        if(horivert == 1) endy += size - 1
        if(endy >= boardwidth) endy = boardwidth - 1;

        //set end location [horizontal]
        let endx = x + 1;
        if(horivert == 0) endx += size - 1
        if(endx >= boardheight) endx = boardheight - 1;

        //place border for ship
        for (let y = starty; y <= endy; y++) {
            for (let x = startx; x <= endx; x++) {
                board[y][x] = Tiles.NoneTaken;
            }
        }

        //place the actual ship
        starty = y;
        endy = (horivert == 1) ? y + size - 1 : y;
        startx = x;
        endx = (horivert == 0) ? x + size - 1 : x;

        for (let y = starty; y <= endy; y++) {
            for (let x = startx; x <= endx; x++) {
                board[y][x] = Tiles.Ship;
            }
        }
    }

    function generateShipSize(count, size){
        let remain = count;

        //not so good randomize, could take a lot of time
        while(remain > 0){
            const horivert = getRandomInt(2); //0 horizontal, 1 vertical
            const x = getRandomInt(boardwidth - (horivert == 0 ? size : 0));
            const y = getRandomInt(boardheight - (horivert == 1 ? size : 0));

            //check if the random placement is valid and retry if not
            let validlocation = checkIsValidLocation(horivert, x, y, size);
            if(!validlocation) continue;
            
            //valid - place ship
            placeShip(horivert, x, y, size);

            //ship was placed
            remain--;
        }
    }

    generateShipSize(ship2, 2);
    generateShipSize(ship3, 3);
    generateShipSize(ship4, 4);
    generateShipSize(ship5, 5);
}

/**
 * Will return a number > 0 if the ship is still afloat 
 */
function checkShipSink(x, y, checked = undefined){
    if(y < 0 || x < 0 || y >= boardwidth || x >= boardheight) return 0;    
    if(board[y][x] != Tiles.Ship && board[y][x] != Tiles.SunkenShip) return 0;
    if(checked){
        for (let i = 0; i < checked.length; i++) {
            const e = checked[i];
            if(e[0] == y && e[1] == x) return 0;
        }
    }

    let count = 0;

    if(!checked) checked = [];
    checked.push([y, x]);

    if(board[y][x] == Tiles.Ship) count++;
    count += checkShipSink(x, y - 1, checked);
    count += checkShipSink(x, y + 1, checked);
    count += checkShipSink(x - 1, y, checked);
    count += checkShipSink(x + 1, y, checked);

    return count;
}

/**
 * Returns true/false
 */
function checkVicotory(){
    let ret = true;

    for (let i = 0; i < boardheight; i++) {
        for (let j = 0; j < boardwidth; j++) {
            if(board[i][j] == Tiles.Ship){
                ret = false;
            }
        }
    }

    return ret;
}

function boardClick(event){
    //get mouse position inside canvas
    var rect = canvas.getBoundingClientRect();
    let xposition = event.clientX - rect.left;
    let yposition = event.clientY - rect.top;

    //get clicked tile
    let x = Math.floor(xposition / TileWidth);
    let y = Math.floor(yposition / TileHeight);

    //handle click
    const id = board[y][x];
    if(id == Tiles.None || id == Tiles.NoneTaken){
        board[y][x] = Tiles.NonePressed;
        drawBoard();
    }
    else if(id == Tiles.Ship){
        board[y][x] = Tiles.SunkenShip;
        drawBoard();

        let victory = checkVicotory();
        if(victory){
            playVictory();
        }else{
            let shipparts = checkShipSink(x, y);
            if(shipparts == 0){
                playAnimation()
            }
        }
    }

    console.log('click at : ' + [x, y]);
}

function drawBoard(){   
    for (let y = 0; y < boardheight; y++) {
        for (let x = 0; x < boardwidth; x++) {
            const tile = board[y][x];

            if(!showcase){
                ctx.fillStyle = ColorLookup[tile];
            }else{
                ctx.fillStyle = ColorLookupShowcase[tile];
            }

            ctx.fillRect(
                x * TileWidth + 1,
                y * TileHeight + 1,
                TileWidth - 2,
                TileHeight - 2
            );
        }
    }
}

restartGame()
drawBoard()