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
var sid = getCookie("-sp-admin-session");
a = function(){
    cle("SESSION:"+sid);
    out("LOADING");
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
document.getElementById("submit").onclick = function () {
    out("BUSY");
    var stuid=document.getElementById("stu").value;
    stuid=stuid.split(",");
    var amnt=document.getElementById("amnt").value;
    var desc=document.getElementById("rsn").value;
    var str = JSON.stringify({"stuid": stuid, "amnt": amnt, "desc": desc});
    out("SENT "+stuid.length);
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            document.getElementById("stu").value="";
            document.getElementById("amnt").value=0;
            document.getElementById("rsn").value="";
            out("STANDBY DONE "+res["count"]);
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            out("STANDBY FAIL");
        }
    }
    x.open("POST", "/axhr/p/gr", true);
    var fd = new FormData();
    fd.append("data", str);
    x.send(fd);
}
a();