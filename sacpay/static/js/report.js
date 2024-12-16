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
function stt(s) {
    document.getElementById("status").innerHTML="STATUS// "+s;
}
function saveToFile(fileName, content) {
    var blob = new Blob([content], { type: 'text/plain' });
    objURL = window.URL.createObjectURL(blob);
    if (window.__Xr_objURL_forCreatingFile__) {
        window.URL.revokeObjectURL(window.__Xr_objURL_forCreatingFile__);
    }
    window.__Xr_objURL_forCreatingFile__ = objURL;
    var a = document.createElement('a');
    a.download = fileName;
    a.href = objURL;
    a.click();
}
sid = getCookie("-sp-admin-session");
document.getElementById("sessid").innerText = "현재 세션 ID: "+sid;
stt("STANDBY");
function users(data) {
    let tbodyData = [];
    var sum = 0;
    for (const iterator of data) {
        tbodyData.push(`
        <tr>
            <td>${iterator.stid}</td>
            <td>${iterator.name}</td>
            <td>${iterator.acid}</td>
            <td>${iterator.blce}</td>
        </tr>
        `)
        sum += iterator.blce;
    }
    return {txt: tbodyData.join(""), sum: sum};
}
function program(data) {
    var pgms = new Set();
    for (const iterator of data) {
        pgms.add(iterator.prgm);
    }
    var l = [...pgms];
    var ndata = new Object();
    for (const pgm of l) {
        ndata[pgm]={
            rprt: new Set(),
            xprt: 0,
            amnt: 0
        }
    }
    let tbodyData = [];
    for (const iterator of data) {
        tbodyData.push(`
        <tr>
            <td>${iterator.time}</td>
            <td>${iterator.prgm}</td>
            <td>${iterator.stid}</td>
            <td>${iterator.resn}</td>
            <td>${iterator.amnt}</td>
            <td>${iterator.apvd}</td>
            <td>${iterator.apby}</td>
        </tr>
        `)
        if (iterator.apvd) {
            ndata[iterator.prgm].rprt.add(iterator.stid);
            ndata[iterator.prgm].xprt += 1;
            ndata[iterator.prgm].amnt += iterator.amnt;
        }
    }
    var fdata = [];
    for (const key of Object.keys(ndata)) {
        fdata.push(`
        <tr>
            <td>${key}</td>
            <td>${ndata[key].rprt.size}</td>
            <td>${ndata[key].xprt}</td>
            <td>${ndata[key].amnt}</td>
        </tr>
        `)
    }
    return {txt: tbodyData.join(""), anl: fdata};
}
function seller(data) {
    var pgms = new Set();
    for (const iterator of data) {
        pgms.add(iterator.prgm);
    }
    var l = [...pgms];
    var ndata = new Object();
    for (const pgm of l) {
        ndata[pgm]={
            rprt: new Set(),
            xprt: 0,
            amnt: 0
        }
    }
    let tbodyData = [];
    for (const iterator of data) {
        tbodyData.push(`
        <tr>
            <td>${iterator.time}</td>
            <td>${iterator.prgm}</td>
            <td>${iterator.stid}</td>
            <td>${-1*iterator.amnt}</td>
            <td>${iterator.rcpt}</td>
        </tr>
        `)
        ndata[iterator.prgm].rprt.add(iterator.stid);
        ndata[iterator.prgm].xprt += 1;
        ndata[iterator.prgm].amnt += iterator.amnt;
    }
    var fdata = [];
    for (const key of Object.keys(ndata)) {
        fdata.push(`
        <tr>
            <td>${key}</td>
            <td>${ndata[key].rprt.size}</td>
            <td>${ndata[key].xprt}</td>
            <td>${-1*ndata[key].amnt}</td>
        </tr>
        `)
    }
    return {txt: tbodyData.join(""), anl: fdata};
}
var working = false;
document.getElementById("rgen").onclick = function() {
    if (working) {
        return;
    }
    working = true;
    stt("리포트 생성중... 대기중");
    var x = new XMLHttpRequest;
    x.onreadystatechange = function(){
        if (this.status == 200 && this.readyState == this.DONE) {
            var res = JSON.parse(x.responseText);
            stt("리포트 생성중... 데이터 변환중");
            //
            date = res.date;
            a0 = users(res.a);
            b0 = program(res.b);
            c0 = seller(res.c);
            //
            stt("리포트 생성중... 파일 생성중");
            content = `
            <!DOCTYPE HTML>
            <html lang="ko">
            <head><meta charset="UTF-8"><title>SAC Pay Report</title></head>
            <body>
                <h1>SAC Pay Report</h1>
                <p>This is automatically generated document. Generated at ${date}</p>
                <br>
                <h2>a. 가입자 명단</h2>
                <table border="1" style="border-collapse:collapse;">
                <tr bgcolor="blue" align="center"><p><td colspan="4" span style="color:white;">Users</td></p></tr>
                <tr align="center" bgcolor="skybule"><td>학번</td><td>이름</td><td>계좌번호</td><td>잔액</td></tr>
                ${a0.txt}
                </table>
                <h5>총 재산: ${a0.sum}</h5>
                <br>
                <h2>b. 지급 내역</h2>
                <table border="1" style="border-collapse:collapse;">
                <tr bgcolor="blue" align="center"><p><td colspan="7" span style="color:white;">Transactions3</td></p></tr>
                <tr align="center" bgcolor="skybule"><td>발생일시</td><td>프로그램명</td><td>대상학번</td><td>지급사유</td><td>금액</td><td>승인여부</td><td>승인자</td></tr>
                ${b0.txt}
                </table>
                <h2>b1. 프로그램 참여율</h2>
                <table border="1" style="border-collapse:collapse;">
                <tr bgcolor="blue" align="center"><p><td colspan="4" span style="color:white;">Transactions3_1</td></p></tr>
                <tr align="center" bgcolor="skybule"><td>프로그램명</td><td>순참가자수(승인)</td><td>중복참가자수(승인)</td><td>총제공금액(승인)</td></tr>
                ${b0.anl}
                </table>
                <br>
                <h2>c. 구매 내역</h2>
                <table border="1" style="border-collapse:collapse;">
                <tr bgcolor="blue" align="center"><p><td colspan="5" span style="color:white;">Transactions2</td></p></tr>
                <tr align="center" bgcolor="skybule"><td>발생일시</td><td>프로그램명</td><td>대상학번</td><td>금액</td><td>구매내역</td></tr>
                ${c0.txt}
                </table>
                <h2>c1. 부스별 매출액</h2>
                <table border="1" style="border-collapse:collapse;">
                <tr bgcolor="blue" align="center"><p><td colspan="4" span style="color:white;">Transactions2_1</td></p></tr>
                <tr align="center" bgcolor="skybule"><td>프로그램명</td><td>순참가자수</td><td>중복참가자수</td><td>총매출</td></tr>
                ${c0.anl}
                </table>
            </body>
            `
            stt("리포트 생성중... 다운로드 준비중");
            saveToFile("report.html", content);
            stt("리포트 생성 완료");
            working = false;
        }
        if (this.status != 200 && this.readyState == this.DONE) {
            stt("리포트 생성중... 다운로드 실패");
            working = false;
        }
    }
    x.open("GET", "/sxhr/rprt", true);
    x.send();
    stt("리포트 생성중... 데이터 다운로드중");
}