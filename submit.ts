const images=["https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/001.png",
            "https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/004.png",
            "https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/007.png"
]

let scoreC: number =0;
let scorePl: number =0;
let existenz:boolean = false;
let select: number=-1;

function start():void{
    const i = Math.floor(3 * Math.random());            // 0bis2
    const imgComp = document.getElementById("computer") as HTMLImageElement
    
    const dec=document.getElementById('decision') as HTMLTextAreaElement;

    if(existenz){                          // sich vergewisssern ,dass der player etwas ausgewählt hat   select=choice
        if (imgComp) {
            const url = images[i];           // select ist für player ,i für computer
            imgComp.src = url
        }
        if(i==select){
            if(dec) {
                dec.innerText= "UNENTSCHIEDEN !!!"
            }
        }else{
            if(i==0){
                if(select==1){
                    if(dec){
                        dec.innerText= "YOU WON!!!"
                        scorePl++
                    }
                }
                if(select==2){
                    if(dec){
                        dec.innerText= "YOU LOSE!!!"
                        scoreC++
                    }
                }
            }
            if(i==1){
                if(select==0){
                    if(dec){
                        dec.innerText= "YOU LOSE!!!"
                        scoreC++
                    }
                }
                if(select==2){
                    if(dec){
                        dec.innerText= "YOU WON!!!"
                        scorePl++
                    }
                }
            }
            if(i==2){
                if(select==0){
                    if(dec){
                        dec.innerText= "YOU WON!!!"
                        scorePl++
                    }
                }
                if(select==1){
                    if(dec){
                        dec.innerText= "YOU LOSE!!!"
                        scoreC++
                    }
                }
            }
                
        }
        updateScore()
        const resetStart=document.getElementById('startButton') as HTMLButtonElement
        if(resetStart){                                                           //  Vérifie si resetStart n'est pas null ou undefined, c'est-à-dire si un élément avec l'ID startButton a été trouvé dans le DOM.
            resetStart.disabled = true;
        }
        const resetNew=document.getElementById('newRoundButton') as HTMLButtonElement
        if(resetNew){
            resetNew.disabled = false;
        }
    }else{
        if(dec){
            dec.innerText= "Please select Your Pokemon"
        }
    }
    
}


function play(choice:number):void{
    const imgPl = document.getElementById("spieler") as HTMLImageElement
    if (imgPl){
        const url = images[choice];
        imgPl.src = url
        select=choice
        existenz= true;
    }
}
function resetGame():void{
    
    const imgComp = document.getElementById("computer") as HTMLImageElement
    if (imgComp){
        imgComp.src="";                         // verschwindet bei Neustarten
    }
    const imgPl = document.getElementById("spieler") as HTMLImageElement
    if (imgPl){
        imgPl.src="";
    }
    //select=-1                              //wegen der Voraussetzung select!=-1 von Methode Start
    existenz = false;
    const resetStart=document.getElementById('startButton') as HTMLButtonElement
    if(resetStart){
        resetStart.disabled = false;
    }
    const resetNew=document.getElementById('newRoundButton') as HTMLButtonElement
    if(resetNew){
        resetNew.disabled = true;
    }
    const schrift = document.getElementById ("decision") as HTMLTextAreaElement;
    if(schrift){
        schrift.textContent="Eine neue Runde wird gestarted!"
    }

}
function updateScore():void{
    const pScore = document.getElementById('scoreP') as HTMLTextAreaElement;
    if(pScore){                                              // != NULL
        pScore.innerText= scorePl.toString()
    }
    const cScore= document.getElementById('scoreC') as HTMLTextAreaElement;
    if(cScore){
        cScore.innerText= scoreC.toString()
    }
}




