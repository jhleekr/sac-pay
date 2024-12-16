var load = 0;
var usr;
var xmlHR = new XMLHttpRequest();
xmlHR.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == this.DONE) {
        var res = JSON.parse(xmlHR.responseText);
        usr = res;
        document.getElementById("balance").innerHTML='잔액: '+usr["balance"]+'ƕ';
        document.getElementById("l3balance").innerHTML='잔액: '+usr["balance"]+'ƕ';
        load += 1;
        del();
    }
};
var xmlHR_QN = new XMLHttpRequest();
xmlHR_QN.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == this.DONE) {
        var res = JSON.parse(xmlHR_QN.responseText);
        popup(res["name"], document.getElementById("amnt").value);
    }
    if (this.status != 200 && this.readyState == this.DONE) {
        popuper("계좌번호가 잘못되었습니다.", "");
    }
};
xmlHR_QN.onerror = function(){
    popuper("계좌번호가 잘못되었습니다.", "");
}
var xmlHR_SD = new XMLHttpRequest();
xmlHR_SD.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == this.DONE) {
        var res = JSON.parse(xmlHR_SD.responseText);
        done();
    }
    if (this.status != 200 && this.readyState == this.DONE) {
        popuper("송금 중 문제가 발생하였습니다.", "");
    }
};
xmlHR_QN.onerror = function(){
    popuper("송금 중 문제가 발생하였습니다.", "");
}
xmlHR.open("GET", "/xhr/usr", true);
xmlHR.send();
this.onload = function() {
    load += 1;
    del();
};
document.getElementById("confirm").onclick=function(){
    var fd = new FormData();
    if(document.getElementById("ano").value.length!=8) {
        popuper("계좌번호가 잘못되었습니다.", "");
        return;
    }
    try{
        if(Number(document.getElementById("amnt").value)>usr["balance"] || Number(document.getElementById("amnt").value)<=0) {
            popuper("잔액이 부족합니다.", "");
            return;
        }
    }catch{
        popuper("금액이 유효하지 않습니다.", "");
    }
    if(document.getElementById("desc").value.length>10 || document.getElementById("desc").value.length<1) {
        popuper("통장 표기는 최대 10글자만", "가능합니다.");
        return;
    }
    fd.append("ano", document.getElementById("ano").value);
    xmlHR_QN.open("POST", "/xhr/qn", true);
    xmlHR_QN.send(fd);
}

function del() {
    if (load==2) {
        document.getElementById("loading").style.display='none';
    }
}
function popup(txt, amnt) {
    document.getElementById("l2text1").innerHTML=txt+' 님에게';
    document.getElementById("l2text2").innerHTML=amnt+'ƕ를 송금할까요?';
    document.getElementById("l2cfrm").innerHTML='보내기';
    document.getElementById("l2deny").onclick=popuphide;
    document.getElementById("l2cfrm").onclick=function(){
        var fd = new FormData();
        fd.append("ano", document.getElementById("ano").value);
        fd.append("amnt", Number(document.getElementById("amnt").value));
        fd.append("desc", document.getElementById("desc").value);
        xmlHR_SD.open("POST", "/xhr/sd", true);
        xmlHR_SD.send(fd);
    }
    elems = document.getElementsByClassName("popup");
    for (i=0; i<elems.length; i++) {
        var el = elems.item(i);
        if (el.id=="l2ctn"){
            el.style.display='flex';
        } else {
            el.style.display='block';
        }
        if (el.id=="l2ctn" || el.id=="l2bg"){
            el.classList.remove("effect");
            void el.offsetWidth;
            el.classList.add("effect");
        }
    }
}
function popuper(txt1, txt2) {
    document.getElementById("l2text1").innerHTML=txt1;
    document.getElementById("l2text2").innerHTML=txt2;
    document.getElementById("l2cfrm").innerHTML='확인';
    document.getElementById("l2cfrm").onclick=popuphide;
    elems = document.getElementsByClassName("popup");
    for (i=0; i<elems.length; i++) {
        var el = elems.item(i);
        if (el.id=="l2deny"){
            continue;
        }
        if (el.id=="l2ctn"){
            el.style.display='flex';
        } else {
            el.style.display='block';
        }
        if (el.id=="l2ctn" || el.id=="l2bg"){
            el.classList.remove("effect");
            void el.offsetWidth;
            el.classList.add("effect");
        }
    }
}
function popuphide() {
    elems = document.getElementsByClassName("popup");
    for (i=0; i<elems.length; i++) {
        elems.item(i).style.display='none';
    }
}
function done() {
    xmlHR.open("GET", "/xhr/usr", true);
    xmlHR.send();
    document.getElementById("l3cfrm").onclick=function(){
        window.location.href="/home";
    };
    elems = document.getElementsByClassName("done");
    for (i=0; i<elems.length; i++) {
        if (elems.item(i).id=="l3bg"){
            elems.item(i).style.display='flex';
        } else {
            elems.item(i).style.display='block';
        }
    }
}
