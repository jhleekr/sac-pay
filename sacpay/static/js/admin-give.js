function e(e){for(var t=e+"=",n=decodeURIComponent(document.cookie).split(";"),a=0;a<n.length;a++){for(var s=n[a];" "==s.charAt(0);)s=s.substring(1);if(0==s.indexOf(t))return s.substring(t.length,s.length)}return""}function t(e){document.getElementById("console").innerHTML="CONSOLE// "+e}function n(e){document.getElementById("output").innerHTML="OUTPUT// "+e}var s=e("-sp-admin-session");a=function(){t("SESSION:"+s),n("LOADING");var e=new XMLHttpRequest;e.onreadystatechange=function(){if(200==this.status&&this.readyState==this.DONE){var t=JSON.parse(e.responseText);pname=t.name,n("STANDBY"),document.getElementById("program").innerHTML="현재 프로그램명: "+pname}},e.open("GET","/axhr/ai",!0),e.send()},document.getElementById("submit").onclick=function(){n("BUSY");var e=document.getElementById("stu").value;e=e.split(",");var t=document.getElementById("amnt").value,a=document.getElementById("rsn").value,s=JSON.stringify({stuid:e,amnt:t,desc:a});n("SENT "+e.length);var r=new XMLHttpRequest;r.onreadystatechange=function(){if(200==this.status&&this.readyState==this.DONE){var e=JSON.parse(r.responseText);document.getElementById("stu").value="",document.getElementById("amnt").value=0,document.getElementById("rsn").value="",n("STANDBY DONE "+e.count)}200!=this.status&&this.readyState==this.DONE&&n("STANDBY FAIL")},r.open("POST","/axhr/p/gr",!0);var u=new FormData;u.append("data",s),r.send(u)},a();