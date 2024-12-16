var order = [];
var ti = 0;

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
function toggle() {
    if (document.getElementById("qr").style.backgroundColor=="black") {
        document.getElementById("qr").style.background = "transparent";
    } else {
        document.getElementById("qr").style.backgroundColor = "black";
    }
}
function cle(s) {
    document.getElementById("console").innerHTML="CONSOLE// "+s;
}
function out(s) {
    document.getElementById("output").innerHTML="OUTPUT// "+s;
}
function stt(s) {
    document.getElementById("status").innerHTML="STATUS// "+s;
}
var sid = getCookie("-sp-admin-session");
a = function(){
    out("LOADING");
    try {
        var s = 'https://sacpay.ksaidev.com/scanner?sid='+sid;
        // The return value is the canvas element
        let canvas = bwipjs.toCanvas('qr', {
                bcid:        'qrcode',       // Barcode type
                text:        s,    // Text to encode
                scale:       15,               // 3x scaling factor
            });
    } catch (e) {
        // `e` may be a string or Error object
    }
    cle("SESSION:"+sid);
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            pname = res["name"];
            out("STANDBY");
            document.getElementById("program").innerHTML="현재 프로그램명: "+pname;
        }
    }
    x.open("GET", "/axhr/ai", true);
    x.send();
}



function updateLTable() {
    out("BUSY");
    renderLTable(order);
    out("STANDBY");
}
function renderLTable(data) {
    let tbodyData = [];
    for (const iterator of data) {
        tbodyData.push(`
        <div id="order-i-${iterator.id}" class="order-i">
            <div class="lbox">
                <div class="stxt">${iterator.mname}</div>
                <div class="stxt">${iterator.mprice} ƕ</div>
            </div>
            <div class="rbox">
                <div class="pm" onclick="minus(${iterator.id})">-</div>
                <div class="txt">${iterator.mcnt}</div>
                <div class="pm" onclick="plus(${iterator.id})">+</div>
            </div>
        </div>
        `)
    }
    document.getElementById("order").innerHTML = tbodyData.join('');
}
updateLTable();
function updateTPrice() {
    var t = 0;
    for (const iterator of order) {
        t += iterator.mprice * iterator.mcnt;
    }
    document.getElementById("amnt").innerText = ""+t+" ƕ";
}
function add(mname, mprice) {
    if (ti>0) {return;}
    mprice = parseInt(mprice);
    for (const iterator of order) {
        if (iterator.mname==mname) {
            plus(iterator.id);
            return;
        }
    }
    order.push(
        {
            id: order.length+1,
            mname: mname,
            mprice: mprice,
            mcnt: 1,
        }
    )
    updateLTable();
    updateTPrice();
}
function addcustom() {
    if (ti>0) {return;}
    a = document.getElementById("mname").value;
    b = document.getElementById("mprice").value;
    if (a.length<0 || a.length>10) {
        alert("메뉴 이름 오류 (1~10자)");
        return;
    }
    if (b<=0||isNaN(parseInt(b))) {
        alert("가격 오류");
        return;
    }
    add(a, b);
    document.getElementById("mname").value = "";
    document.getElementById("mprice").value = 0;
}
function minus(id) {
    if (ti>0) {return;}
    order[id-1].mcnt-=1;
    if (order[id-1].mcnt==0) {
        order.splice(id-1,1)
        for (var i=0; i<order.length; i++) {
            order[i].id = i+1;
        }
    }
    updateLTable();
    updateTPrice();
}
function plus(id) {
    if (ti>0) {return;}
    order[id-1].mcnt+=1;
    updateLTable();
    updateTPrice();
}


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
    x.open("GET", "/axhr/s/menu", true);
    x.send();
}
function renderRTable(data) {
    let tbodyData = [];
    for (const iterator of data) {
        tbodyData.push(`
        <div id="menu-i-${iterator.id}" class="menu-i" onclick="add('${iterator.mname}',${iterator.mprice})">
            <div class="stxt">${iterator.mname}</div>
            <div class="stxt">${iterator.mprice} ƕ</div>
        </div>
        `)
    }
    document.getElementById("menu").innerHTML = tbodyData.join('');
}
updateRTable();


var suc = false;
var dat = [];
document.getElementById("pbtn").onclick = function() {
    if (ti>0) {return;}
    ti = 30;
    out("BUSY");
    stt("대기중 "+ti);
    document.getElementById("pbtn").innerText="대기중";
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            out("WAIT");
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("STANDBY FAIL");
        }
    }
    x.open("GET", "/axhr/s/tint", true);
    x.send();
    setTimeout(trypayment, 1000);
}
function trypayment() {
    ti-=1;
    if (ti<1) {
        ti = 0;
        stt("시간초과");
        out("STANDBY");
        document.getElementById("pbtn").innerText="결제요청";
        return;
    }
    stt("대기중 "+ti);
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            if (res["result"]=="success") {
                stt("결제성공");
                ti = 0;
                order = [];
                updateLTable();
                updateTPrice();
                out("STANDBY");
                document.getElementById("pbtn").innerText="결제요청";
                return;
            } else if (res["detail"]==1) {
                setTimeout(trypayment, 1000);
                return;
            } else if (res["detail"]==2) {
                stt("QR만료");
                ti = 0;
                out("STANDBY");
                document.getElementById("pbtn").innerText="결제요청";
                return;
            } else if (res["detail"]==3) {
                stt("잔액부족");
                ti = 0;
                out("STANDBY");
                document.getElementById("pbtn").innerText="결제요청";
                return;
            } else if (res["detail"]==4) {
                stt("금액오류");
                ti = 0;
                out("STANDBY");
                document.getElementById("pbtn").innerText="결제요청";
                return;
            }
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("STANDBY FAIL");
        }
    }
    x.open("POST", "/axhr/s/tpay", true);
    var fd = new FormData;
    fd.append("data", JSON.stringify(order));
    x.send(fd);
}

a();