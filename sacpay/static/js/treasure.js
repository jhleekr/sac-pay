function getUrlParams() {
	var params = {};
	window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) {
		params[key] = value;
	});
	return params;
}
var p = getUrlParams();
var a = new XMLHttpRequest;
a.onreadystatechange = function () {if(this.status==200&&this.readyState==this.DONE){var r=JSON.parse(a.responseText);document.getElementById("acnt").innerHTML="현재 계정: "+r["name"]+" (계좌번호: "+r["ano"]+")";}};if(lgn==1){a.open("GET", "/xhr/usr", true);a.send();}
var b = new XMLHttpRequest;
b.onreadystatechange = function () {if(this.status==200&&this.readyState==this.DONE){var r=JSON.parse(b.responseText);document.getElementById("amnt").innerHTML="금액: "+r["amnt"]+" ƕ";document.getElementById("rank").innerHTML="축하합니다! "+r["pos"]+"의 보물을 "+r["rank"]+"번째로 찾으셨습니다!";}};b.open("GET", "/xhr/trs?t="+p["t"], true);b.send();
function y(w){try{if(w.location=="https://sacpay.ksaidev.com/home"){w.close();window.location.reload();}}catch(e){}}function x(){w=open("/login","_blank","popup=true");setInterval(y,100,w);}
function z(){window.location.replace("https://sacpay.ksaidev.com/treasurergs?t="+p["t"]);}