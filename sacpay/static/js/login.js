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
            alert("구글 로그인에 실패하였습니다");
            break;
        case "2":
            alert("@ksa.hs.kr 계정만 사용 가능합니다");
            break;
        case "3":
            alert("학생 정보가 잘못되었습니다");
            break;
        default:
            alert("알 수 없는 오류입니다");
    }
}