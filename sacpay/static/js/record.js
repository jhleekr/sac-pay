var e=new XMLHttpRequest;e.onreadystatechange=function(){if(200==this.status&&this.readyState==this.DONE){var t=JSON.parse(e.responseText);d();for(var o=0;o<t.length;o++)n(o+1,t[o])}},e.open("POST","/xhr/rcd",!0);var t=new FormData;function n(e,t){const n=document.createElement("div");n.setAttribute("id","desc"+e),n.setAttribute("class","rec"+e),n.style.top=6+15*(e-1)+"vh",document.getElementById("content").appendChild(n);const d=document.createElement("div");d.setAttribute("id","amnt"+e),d.setAttribute("class","rec"+e),d.style.top=10+15*(e-1)+"vh",document.getElementById("content").appendChild(d);const o=document.createElement("div");o.setAttribute("id","time"+e),o.setAttribute("class","rec"+e),o.style.top=15+15*(e-1)+"vh",document.getElementById("content").appendChild(o);const c=document.createElement("div");c.setAttribute("id","apvd"+e),c.setAttribute("class","rec"+e),c.style.top=15+15*(e-1)+"vh",document.getElementById("content").appendChild(c);const i=document.createElement("div");i.setAttribute("id","bord"+e),i.setAttribute("class","rec"+e),i.style.top=4+15*(e-1)+"vh",document.getElementById("content").appendChild(i),document.getElementById("bord"+e).onclick=function(){open("/rcpt?t="+t.tid,"_blank","width=320,height=600,status=no,menubar=no,toolbar=no,resizable=no,location=no")},document.getElementById("desc"+e).innerHTML=t.desc,document.getElementById("time"+e).innerHTML=t.time,document.getElementById("apvd"+e).innerHTML=t.apvd,"취소"==t.apvd?document.getElementById("amnt"+e).style.color="gray":t.amnt>0?document.getElementById("amnt"+e).style.color="green":(document.getElementById("amnt"+e).style.color="red",t.amnt*=-1),"대기중"==t.apvd?document.getElementById("amnt"+e).style.textDecorationStyle="line-through":document.getElementById("amnt"+e).style.textDecorationStyle="",document.getElementById("amnt"+e).innerHTML=t.amnt+" ƕ"}function d(){for(idx=1;idx<=20;idx++)for(elems=document.getElementsByClassName("rec"+idx),i=0;i<elems.length;i++)elems.item(i).remove()}t.append("s",0),t.append("n",20),e.send(t);