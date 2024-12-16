function getUrlParams() {
    var params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) {
        params[key] = value;
    });
    return params;
}
var params = getUrlParams();
if("f" in params) {
    switch(params["f"]) {
        case "1":
            alert("로그인에 실패하였습니다");
            break;
        default:
            alert("알 수 없는 오류입니다");
    }
}
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
var sid = getCookie("-sp-admin-session");
cle("SESSION:"+sid);