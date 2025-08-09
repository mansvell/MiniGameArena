"use strict";
const images = ["https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/001.png",
    "https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/004.png",
    "https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/007.png"
];
let scoreC = 0;
let scorePl = 0;
let select = -1;
let existenz = false;

function start() {
    const i = Math.floor(3 * Math.random());  // de 0 a 3 (3exclus)
    const imgComp = document.getElementById("computer");
    const dec = document.getElementById("decision");
    if (existenz) {
        if (imgComp) {
            const url = images[i];
            imgComp.src = url;
        }
        if (i == select) {
            if (dec) {
                dec.innerText = "UNENTSCHEIDEN !!!";
            }
        }
        else {
            if (i == 0 && select == 1){
                    if (dec) {
                        dec.innerText = "YOU WON!!!";
                        scorePl++;
                    }
            }
            if (i == 0 && select == 2) {
                    if (dec) {
                        dec.innerText = "YOU LOSE!!!";
                        scoreC++;
                    }
            }
            if (i == 1 && select == 0) {
                    if (dec) {
                        dec.innerText = "YOU LOSE!!!";
                        scoreC++;
                    }
            }
            if (i == 1 && select == 2){
                    if (dec) {
                        dec.innerText = "YOU WON!!!";
                        scorePl++;
                    }
            }
            if (i == 2 && select ==0) {
                    if (dec) {
                        dec.innerText = "YOU WON!!!";
                        scorePl++;
                    }
            }
            if (i==2 && select == 1){ 
                    if (dec) {
                        dec.innerText = "YOU LOSE!!!";
                        scoreC++;
                    }
            }
        }
        updateScore();
        const resetStart = document.getElementById('startButton');
        if (resetStart) {                  
            resetStart.disabled = true;
        }
        const resetNew = document.getElementById('newRoundButton');
        if (resetNew) {
            resetNew.disabled = false;
        }
    }
    else {
        if (dec) {
            dec.innerText = "Please select Your Pokemon";
        }
    }
}

function play(choice) {
    const imgPl = document.getElementById("spieler");
    if (imgPl) {
        const url = images[choice];
        imgPl.src = url;
        select = choice;
        existenz = true;
    }
}
function resetGame() {
    const imgComp = document.getElementById("computer");
    if (imgComp) {
        imgComp.src = "";
    }
    const imgPl = document.getElementById("spieler");
    if (imgPl) {
        imgPl.src = "";
    }
    existenz = false;
    const resetStart = document.getElementById('startButton');
    if (resetStart) {
        resetStart.disabled = false;
    }
    const resetNew = document.getElementById('newRoundButton');
    if (resetNew) {
        resetNew.disabled = true;
    }
    const schrift = document.getElementById ("decision");
    if(schrift){
        schrift.textContent="Eine neue Runde wird gestarted!"
    }
}
function updateScore() {
    const pScore = document.getElementById('scoreP');
    if (pScore) {
        pScore.innerText = scorePl.toString();  // important de rajouter .toString() car .innerText attend une donnée String et non number comme scorePl
    }
    const cScore = document.getElementById('scoreC');
    if (cScore) {
        cScore.innerText = scoreC.toString();
    }
}
