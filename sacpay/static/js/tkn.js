function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function cle(s) {
    document.getElementById("console").innerHTML="CONSOLE// "+s;
}
function out(s) {
    document.getElementById("output").innerHTML="OUTPUT// "+s;
}
document.getElementById("sbmt").onclick=function(){
    out("BUSY");
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            updateLTable();
            out("STANDBY");
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("STANDBY FAIL");
        }
    }
    x.open("POST", "/sxhr/atrs", true);
    var fd = new FormData();
    fd.append("data", document.getElementById("pos").value+",10,4");
    x.send(fd);
}
document.getElementById("del").onclick=function(){
    out("BUSY");
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            if (res.res=="fail"){alert("없는 코드입니다.");}
            updateLTable();
            out("STANDBY");
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("STANDBY FAIL");
        }
    }
    x.open("POST", "/sxhr/dtrs", true);
    var fd = new FormData();
    fd.append("data", document.getElementById("cod").value);
    x.send(fd);
}
var sid = getCookie("-sp-admin-session");
cle("SESSION:"+sid);
function updateLTable() {
    out("BUSY");
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            renderLTable(res);
            out("STANDBY");
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("STANDBY FAIL");
        }
    }
    x.open("GET", "/sxhr/xtrs", true);
    x.send();
}
function renderLTable(data) {
    let tbodyData = [];
    for (const iterator of data) {
        tbodyData.push(`
        <tr>
            <td>${iterator.tid}</td>
            <td>${iterator.pos}</td>
            <td>${iterator.amnt1}</td>
            <td>${iterator.amnt2}</td>
            <td>${iterator.redeem}</td>
            <td>${iterator.stuid}</td>
        </tr>
        `)
    }
    document.querySelector('#ltable > tbody').innerHTML = tbodyData.join('');
}
updateLTable();
function loop() {
    updateLTable();
    setTimeout(loop, 30000);
}
loop();