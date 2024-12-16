var scan = true;
var sid;
function onScanSuccess(decodedText, decodedResult) {
	if (!scan) {
		return;
	}
	// handle the scanned code as you like, for example:
	scan = false;
	console.log(`Code matched = ${decodedText}`, decodedResult);
	out("MATCH\n["+decodedText+"]");
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
			if (res["res"] == "suc") {
				out("MATCH SUBMIT DONE\n["+decodedText+"]");
			} else {
				out("MATCH SUBMIT WRONG\n["+decodedText+"]");
			}
        }
        if (this.status != 200 && this.readyState == this.DONE) {
			out("MATCH SUBMIT FAIL\n["+decodedText+"]");
        }
    }
    x.open("POST", "/axhr/s/scan", true);
    var fd = new FormData();
    fd.append("sid", sid);
    fd.append("txt", decodedText);
    x.send(fd);
	out("MATCH SUBMIT\n["+decodedText+"]");
	setTimeout(function(){scan = true;}, 5000);
}
function onScanFailure(error) {
	if (!scan) {
		return;
	}
	// handle scan failure, usually better to ignore and keep scanning.
	// for example:
	console.warn(`Code scan error = ${error}`);
	out("STANDBY");
}
function cle(s) {
	document.getElementById("txt2").innerHTML = s;
}
function out(s) {
	document.getElementById("txt4").innerHTML = s;
}
function getUrlParams() {
	var params = {};
	window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) {
		params[key] = value;
	});
	return params;
}
var params = getUrlParams();
var html5QrcodeScanner;
if ("sid" in params) {
	sid = params["sid"];
	html5QrcodeScanner = new Html5QrcodeScanner(
		"reader",
		{
			fps: 5, qrbox: { width: 250, height: 250 },
			supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
			formatsToSupport: [Html5QrcodeSupportedFormats.AZTEC]
		},
		/* verbose= */ false);
	html5QrcodeScanner.render(onScanSuccess, onScanFailure);
	cle("SESSION: " + sid);
}