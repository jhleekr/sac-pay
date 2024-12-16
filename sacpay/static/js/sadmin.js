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
function a(tid) {
    out("BUSY APRV");
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
    x.open("POST", "/sxhr/aprv", true);
    var fd = new FormData();
    fd.append("data", tid);
    x.send(fd);
}
function d(tid) {
    out("BUSY DENY");
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
    x.open("POST", "/sxhr/deny", true);
    var fd = new FormData();
    fd.append("data", tid);
    x.send(fd);
}
function n(uid) {
    out("BUSY UPDNAME");
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            updateRTable();
            out("STANDBY");
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("STANDBY FAIL");
        }
    }
    x.open("POST", "/sxhr/name", true);
    var fd = new FormData();
    fd.append("data", JSON.stringify({
        "uid": uid,
        "dat": document.getElementById("tinput_"+uid).value,
    }));
    x.send(fd);
}
function p(uid) {
    out("BUSY UPDPSWD");
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            updateRTable();
            out("STANDBY");
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("STANDBY FAIL");
        }
    }
    x.open("POST", "/sxhr/pswd", true);
    var fd = new FormData();
    fd.append("data", JSON.stringify({
        "uid": uid,
        "dat": document.getElementById("tinput_"+uid).value,
    }));
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
    x.open("GET", "/sxhr/at", true);
    x.send();
}
function renderLTable(data) {
    let tbodyData = [];
    for (const iterator of data) {
        tbodyData.push(`
        <tr>
            <td>${iterator.name}</td>
            <td>${iterator.desc}</td>
            <td>${iterator.amnt}</td>
            <td>
                <input type="button" class="btn" value="승인" onclick="a('${iterator.tid}')">
                <input type="button" class="btn" value="거절" onclick="d('${iterator.tid}')">
            </td>
        </tr>
        `)
    }
    document.querySelector('#ltable > tbody').innerHTML = tbodyData.join('');
}
updateLTable();
function updateRTable() {
    out("BUSY");
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            renderRTable(res);
            out("STANDBY");
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("STANDBY FAIL");
        }
    }
    x.open("GET", "/sxhr/aa", true);
    x.send();
}
function renderRTable(data) {
    let tbodyData = [];
    for (const iterator of data) {
        tbodyData.push(`
        <tr>
            <td>${iterator.uid}</td>
            <td>${iterator.name}</td>
            <td>${iterator.actype}</td>
            <td>
                <input type="text" id="tinput_${iterator.uid}">
                <input type="button" class="btn" value="이름" onclick="n('${iterator.uid}')">
                <input type="button" class="btn" value="안쓰는버튼" onclick="p('${iterator.uid}')">
            </td>
        </tr>
        `)
    }
    document.querySelector('#rtable > tbody').innerHTML = tbodyData.join('');
}
updateRTable();
function loop() {
    updateLTable();
    setTimeout(loop, 30000);
}
loop();