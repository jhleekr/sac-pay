function getUrlParams() {
	var params = {};
	window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (str, key, value) {
		params[key] = value;
	});
	return params;
}
var params = getUrlParams();
const tid = params["t"];
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function () {
    if (this.status == 200 && this.readyState == this.DONE) {
        var res = JSON.parse(xhr.responseText);
        disp(res);
    }
};
xhr.open("GET", "/xhr/rcpt?t="+tid, true);
xhr.send();
function abs(n) {
    if (n>0) {return n;}
    else {return -1*n;}
}
function disp(data) {
    try {
        // The return value is the canvas element
        let canvas = bwipjs.toCanvas('code', {
                bcid:        'pdf417',       // Barcode type
                text:        tid,    // Text to encode
                scale:       15,               // 3x scaling factor
            });
    } catch (e) {
        // `e` may be a string or Error object
    }
    switch (data.issuer_type) {
        case 1:
            if (data.amount>0) document.getElementById("type").innerText='입금 내역';
            else document.getElementById("type").innerText='송금 내역';
            break;
        case 2:
            document.getElementById("type").innerText='영수증';
            break;
        case 3:
            document.getElementById("type").innerText='지급 내역';
            break;
        case 4:
            document.getElementById("type").innerText='거래 내역';
            break;
        case 7:
            document.getElementById("type").innerText='지급 내역';
            break;
        default:
            document.getElementById("type").innerText='error';
            return;
    }
    console.log(data);
    const node2 = document.createElement("div");
    node2.setAttribute("class", "rec");
    node2.innerText = "금액: "+abs(data.amount)+"ƕ";
    document.getElementById("detail").appendChild(node2);
    const node3 = document.createElement("div");
    node3.setAttribute("class", "rec");
    node3.innerText = "거래일시: "+data.timestamp;
    document.getElementById("detail").appendChild(node3);
    const node10 = document.createElement("div");
    node10.setAttribute("class", "rec");
    node10.innerText = "거래상태: "+data.approved;
    document.getElementById("detail").appendChild(node10);
    const node4 = document.createElement("div");
    node4.setAttribute("class", "rec");
    node4.innerText = "사유: "+data.description;
    document.getElementById("detail").appendChild(node4);
    if (data.issuer_type==2){
        const node5 = document.createElement("div");
        node5.setAttribute("class", "rec");
        node5.innerText = "구매내역:";
        document.getElementById("detail").appendChild(node5);
        const node0 = document.createElement("table");
        document.getElementById("detail").appendChild(node0);
        const node6 = document.createElement("table");
        document.getElementById("detail").appendChild(node6);
        const node7 = document.createElement("th");
        node7.innerText = "상품명";
        const node8 = document.createElement("th");
        node8.innerText = "가격";
        const node9 = document.createElement("th");
        node9.innerText = "개수";
        node0.appendChild(node7);
        node0.appendChild(node8);
        node0.appendChild(node9);
        for(d in data.reciept.split("/")) {
            d = data.reciept.split("/")[d]
            if (d.length>1) {
                var x = d.split(",");
                var node = document.createElement("tr");
                node0.appendChild(node);
                var nde1 = document.createElement("td");
                nde1.innerText = x[0];
                node.appendChild(nde1);
                nde1 = document.createElement("td");
                nde1.innerText = x[1];
                node.appendChild(nde1);
                nde1 = document.createElement("td");
                nde1.innerText = x[2];
                node.appendChild(nde1);
            }
        }
    }
}