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
const lang = getCookie("-sp-lang");
if (lang=="en") {
    if(window.location.href.endsWith("home")){
        document.getElementById("pay").innerText = "Payment";
        document.getElementById("send").innerText = "Send";
        document.getElementById("record").innerText = "Recent Transactions >";
    }
    if(window.location.href.endsWith("record")){
        document.getElementById("welcome").innerText = "Transaction History";
    }
    if(window.location.href.endsWith("pay")){
        document.getElementById("menuname").innerText = "Payment";
        document.getElementById("timetxt1").innerText = "Time Left";
    }
    if(window.location.href.endsWith("send")){
        document.getElementById("menuname").innerText = "Remittance";
        document.getElementById("lano").innerText = "Account Number";
        document.getElementById("lamnt").innerText = "Amount to Send";
        document.getElementById("ldesc").innerText = "Passbook Display (max. 10 char)";
        document.getElementById("confirm").innerText = "Confirm";
    }
}