var load = 0;
var xmlHR = new XMLHttpRequest();
xmlHR.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == this.DONE) {
        var res = JSON.parse(xmlHR.responseText);
        document.getElementById("welcome").innerHTML="환영합니다 "+res["name"]+"님!";
        document.getElementById("ano").innerHTML="# "+res["ano"].substr(0,4)+" "+res["ano"].substr(4,4);
        document.getElementById("balance").innerHTML=res["balance"]+" ƕ";
        load += 1;
        del();
    }
};
xmlHR.open("GET", "/xhr/usr", true);
xmlHR.send();
var xmlHR_RCD = new XMLHttpRequest();
xmlHR_RCD.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == this.DONE) {
        var res = JSON.parse(xmlHR_RCD.responseText);
        for (var i=0; i<2; i++) {
            hide(i+1);
        }
        for (var i=0; i<res.length; i++) {
            srec(i+1, res[i]);
        }
    }
};
xmlHR_RCD.open("POST", "/xhr/rcd", true);
var fd = new FormData();
fd.append("s", 0);
fd.append("n", 2);
xmlHR_RCD.send(fd);
this.onload = function() {
    load += 1;
    del();
};
function del() {
    if (load==2) {
        document.getElementById("loading").remove();
    }
}
function srec(idx, t) {
    document.getElementById("desc"+idx).innerHTML=t["desc"];
    document.getElementById("time"+idx).innerHTML=t["time"];
    document.getElementById("apvd"+idx).innerHTML=t["apvd"];
    if (t["apvd"]=="취소") {
        document.getElementById("amnt"+idx).style.color='gray';
    } else if (t["amnt"]>0) {
        document.getElementById("amnt"+idx).style.color='green';
    } else {
        document.getElementById("amnt"+idx).style.color='red';
        t["amnt"]*=-1;
    }
    if (t["apvd"]=="대기중") {
        document.getElementById("amnt"+idx).style.textDecorationStyle='line-through';
    } else {
        document.getElementById("amnt"+idx).style.textDecorationStyle='';
    }
    document.getElementById("amnt"+idx).innerHTML=t["amnt"]+" ƕ";
    elems = document.getElementsByClassName("rec"+idx);
    for (i=0; i<elems.length; i++) {
        elems.item(i).style.display='block';
    }
}
function hide(idx) {
    elems = document.getElementsByClassName("rec"+idx);
    for (i=0; i<elems.length; i++) {
        elems.item(i).style.display='none';
    }
}
document.getElementById("logout").onclick = function() {
    window.location.href = "/logout";
};
document.getElementById("send").onclick = function() {
    window.location.href = "/send";
};
document.getElementById("record").onclick = function() {
    window.location.href = "/record";
};
document.getElementById("pay").onclick = function() {
    window.location.href = "/pay";
};