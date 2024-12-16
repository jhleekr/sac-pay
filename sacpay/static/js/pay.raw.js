var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == this.DONE) {
        var res = JSON.parse(xhr.responseText);
        try {
            // The return value is the canvas element
            let canvas = bwipjs.toCanvas('qr', {
                    bcid:        'azteccode',       // Barcode type
                    text:        res["tid"],    // Text to encode
                    scale:       15,               // 3x scaling factor
                });
        } catch (e) {
            // `e` may be a string or Error object
        }
        /*
        var qrcode = new QRCode(document.getElementById("qr"), {
            text: res["tid"],
            width: 1024,
            height: 1024,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
        */
        var ts = Math.floor(+ new Date() / 1000);
        setTimer(30-ts+res["timestamp"]);
    }
};
function updateqr() {
    xhr.open("GET", "/xhr/rt", true);
    xhr.send();
}
function setTimer(n) {
    document.getElementById("timetxt2").innerHTML = n+"초";
    document.getElementById("barfront").style.width = Math.min(80,(80/30*n))+"vw";
    if(n>0){setTimeout(setTimer, 1000, n-1);}
    else{updateqr();}
}
document.getElementById("home").onclick = function() {
    window.location.href = "/home";
};
updateqr();
