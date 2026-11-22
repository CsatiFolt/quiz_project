

const cim = document.getElementsByTagName("h2")[0];
const kerdesP = document.getElementById("kerdes");
const answers = document.querySelector(".answers");
const eredmeny = document.getElementsByClassName("eredmeny")[0];

const g_ell = document.querySelector("#ell");
const g_next = document.getElementById("next");

const gombok = document.querySelectorAll(".gomb");
const radiok = document.getElementsByName("valasz"); 

g_ell.addEventListener("click", ered); 
g_next.addEventListener("click", next_q);

let kerdesek = [];
let sorrend = [];
let index = 0;
let pont = 0;
let answers_rn = [];

//A quiz kérdéseket AI csinálta
//A betoltes, sh_quest func-okhoz és a createElement-ekhez és beállításaikhoz kellett AI segítség, mert gyorsabb vele szintaxist keresni
//A shuffle internetről van
//Jó válaszok kinézhetők, elvileg php kéne hozzá, amihez lusta vagyok
//Swal és then teljesen új volt(Még azzal sem tudnék mit kezdeni egyedül)


async function betoltes() {       //Betölti a file-t(ezt még tanulni kell, vannak benne új cuccok)
    const valasz = await fetch("json/fr_aer_quest.json");
    kerdesek = await valasz.json();
    inditas();
}

function inditas() {
    sorrend = keveres(kerdesek).slice(0, 20);
    sh_quest();
}

function keveres(tomb) {              //Fisher-yates shuffle(enélkül kardomba dőlök)
    const masolat = tomb.slice();
    for (let i = masolat.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = masolat[i];
        masolat[i] = masolat[j];
        masolat[j] = temp;
    }
    return masolat;
}

function make_quiz(k) {   //Kiválasztja a jó választ és 3 rosszat, majd shuffle-öli
    const helyesek = k.valaszok.filter(v => v.helyes);
    const rosszak = keveres(k.valaszok.filter(v => !v.helyes)).slice(0, 3);
    return keveres(helyesek.concat(rosszak));
}

function sh_quest() {            //Leszedi az előző cuccokat, majd megjeleníti a kérdéseket
    const k = sorrend[index];
    answers_rn = make_quiz(k);

    kerdesP.textContent = `${index + 1}. ${k.kerdes}`;
    answers.innerHTML = "";
    eredmeny.textContent = "";

    answers_rn.forEach((v, i) => {      //Beírja a mostani válaszok a helyükre
        const label = document.createElement("label");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "valasz";
        radio.value = i;
        label.append(radio, " " + v.szoveg);
        answers.append(label);
    });
}


function ered() {         //Eredmény kiírása: Ha nincs válasz, szól
    const answer = document.querySelector('input[name="valasz"]:checked');
    if (answer === null) {
        eredmeny.textContent = "Válassz egy választ!";
        return;
    }

    const k = sorrend[index];
    const chosen = answers_rn[Number(answer.value)];
    const helyes = answers_rn.find(v => v.helyes);

    if (chosen.helyes) {   //Ha helyes akkor a nehézséghez képest ad valamennyi pontot
        eredmeny.textContent = `Helyes! ${chosen.miert}`;  //elmondja miért az(hátha tippelt a felh., ha már szerencsés, tudja miért jó)
        pont = pont + k.nehezseg;
    } else {          //Ha rossz akkor elmondja miért és mi a jó
        if (chosen.abszurd) {    //Ha nagyon rossz, levon egy pontot
            pont = pont - 1;
        }
        eredmeny.textContent = `Helytelen. ${chosen.miert} A helyes válasz: ${helyes.szoveg}. ${helyes.miert}`;
    }

    for (let r of radiok) {
        r.disabled = true;
    }
    g_ell.disabled = true;
    g_next.disabled = false;
}


function next_q() {     //Átvált a következő kérdésre
    index = index + 1;
    if (index < sorrend.length) {   //Ha van még kérdés: vált
        sh_quest();
        g_ell.disabled = false;
        g_next.disabled = true;
    } else {                        //Ha nincs: Kiírja, hogy vége és a pontszámot
        let maxPont = 0;
        for (let k of sorrend) {
            maxPont = maxPont + k.nehezseg;
        }
        cim.textContent = "Eredmény";
        kerdesP.textContent = `Elért pontszám: ${pont} / ${maxPont}`;
        answers.innerHTML = "";
        eredmeny.textContent = "";
        for (let g of gombok) {   //Eltűnteti a gombokat
            g.style.display = "none";
        }
        vegeredmeny(maxPont);
    }
}

function vegeredmeny(maxPont) {
    const szazalek = Math.max(0, Math.round(pont / maxPont * 100));
    let ertekeles;
    let ikon;

    if (szazalek >= 90) {
        ertekeles = "Kiváló!";
        ikon = "success";
    } else if (szazalek >= 70) {
        ertekeles = "Nagyon jó!";
        ikon = "success";
    } else if (szazalek >= 50) {
        ertekeles = "Nem rossz!";
        ikon = "info";
    } else if (szazalek >= 30) {
        ertekeles = "Van még mit gyakorolni.";
        ikon = "warning";
    } else {
        ertekeles = "Ez most nem sikerült.";
        ikon = "error";
    }

    swal({
        title: ertekeles,
        text: `${pont} / ${maxPont} pont (${szazalek}%)`,
        icon: ikon,
        button: "Újrakezdés",
        closeOnClickOutside: false,
        closeOnEsc: false
    }).then(ujrakezdes);
}

function ujrakezdes() {
    index = 0;
    pont = 0;
    cim.textContent = "Quiz";
    for (let g of gombok) {
        g.style.display = "";
    }
    g_ell.disabled = false;
    g_next.disabled = true;
    inditas();
}

betoltes();


//Ötlet
        //Style: frutiger aero(Ez sem teljesen egyedül készült az alap kialakítás az enyém, stílus ötlet: frutigeraeroarchive.org oldalról van)
        //Scoring:  - Easy-Hard question: 1-3 points
        //          - Partial answers give points
        //          - Minus points for no-read guesses(pl. alma egy kék zöldség) 
        //
        //Quiz:
        //          - kétszer nem szerepelhet ugyanaz(ne lehessen megmondani melyik jó sok újraindítással vagy source code megnézéssel)
        //          - 20 kérdés

