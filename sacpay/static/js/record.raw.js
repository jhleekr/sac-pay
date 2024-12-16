var xmlHR_RCD = new XMLHttpRequest();
xmlHR_RCD.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == this.DONE) {
        var res = JSON.parse(xmlHR_RCD.responseText);
        clear();
        for (var i=0; i<res.length; i++) {
            srec(i+1, res[i]);
        }
    }
};
xmlHR_RCD.open("POST", "/xhr/rcd", true);
var fd = new FormData();
fd.append("s", 0);
fd.append("n", 20);
xmlHR_RCD.send(fd);
function srec(idx, t) {
    const node1 = document.createElement("div");
    node1.setAttribute("id", "desc"+idx);
    node1.setAttribute("class", "rec"+idx);
    node1.style.top = -6+12+(15)*(idx-1)+"vh";
    document.getElementById("content").appendChild(node1);
    const node2 = document.createElement("div");
    node2.setAttribute("id", "amnt"+idx);
    node2.setAttribute("class", "rec"+idx);
    node2.style.top = -6+16+(15)*(idx-1)+"vh";
    document.getElementById("content").appendChild(node2);
    const node3 = document.createElement("div");
    node3.setAttribute("id", "time"+idx);
    node3.setAttribute("class", "rec"+idx);
    node3.style.top = -6+21+(15)*(idx-1)+"vh";
    document.getElementById("content").appendChild(node3);
    const node4 = document.createElement("div");
    node4.setAttribute("id", "apvd"+idx);
    node4.setAttribute("class", "rec"+idx);
    node4.style.top = -6+21+(15)*(idx-1)+"vh";
    document.getElementById("content").appendChild(node4);
    const node5 = document.createElement("div");
    node5.setAttribute("id", "bord"+idx);
    node5.setAttribute("class", "rec"+idx);
    node5.style.top = -6+10+(15)*(idx-1)+"vh";
    document.getElementById("content").appendChild(node5);
    document.getElementById("bord"+idx).onclick = function(){
        open("/rcpt?t="+t["tid"],"_blank","width=320,height=600,status=no,menubar=no,toolbar=no,resizable=no,location=no");
    };

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
}
function clear() {
    for (idx=1; idx<=20; idx++) {
        elems = document.getElementsByClassName("rec"+idx);
        for (i=0; i<elems.length; i++) {
            elems.item(i).remove();
        }
    }
}
document.getElementById("home").onclick = function() {
    window.location.href = "/home";
};