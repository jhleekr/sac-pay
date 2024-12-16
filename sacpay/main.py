from pymysql.err import OperationalError as OE1
from sqlalchemy.exc import OperationalError as OE2
import os
import traceback
from typing import Optional
from fastapi import FastAPI, Form, Request, Response, UploadFile, Depends
from fastapi.responses import (
    HTMLResponse,
    JSONResponse,
    FileResponse,
    RedirectResponse,
    PlainTextResponse,
)
from pydantic import BaseModel, FilePath
from fastapi.exceptions import FastAPIError, HTTPException, RequestValidationError
import json
import asyncio
from datetime import datetime
from datetime import timedelta
import hashlib
import requests
import re
import string
import qrcode
from oauthlib.oauth2 import WebApplicationClient
from database import abc, add_reciept, adm_uid_to_name, aprv, deny, engine, SessionLocal, Base, generate_transaction_sell, get_hashed_password, get_receipt, log
from database import get_trans, get_user_by_email, get_user_by_uid, p_all, query_token, s_add, s_get, t_all, t_append, t_del, t_get, t_use, verify_session
from database import verify_asession, login, get_user_by_ano, generate_transaction, TransactionBase, update_balance, get_token
from database import add_admin, get_admin, delete_admin, update_admin, admin_login, p_append, p_pop
from sqlalchemy.orm import Session
from datetime import timedelta

app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)

Base.metadata.create_all(bind=engine)

# Dependency


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def checkSess(db: Session, request: Request):
    if "-sp-session" not in request.cookies:
        return None
    return verify_session(db, request.cookies["-sp-session"])


def checkAdminSess(db: Session, request: Request):
    if "-sp-admin-session" not in request.cookies:
        return None
    return verify_asession(db, request.cookies["-sp-admin-session"])

def content(file_path: str) -> str:
    if file_path[-2:] == "js":
        file_path = "js/"+file_path
    elif file_path[-3:] == "css":
        file_path = "css/"+file_path
    elif file_path[-4:] == "json":
        file_path = "json/"+file_path
    elif not file_path[-4:] == "html":
        raise Exception()
    with open(f"static/{file_path}", encoding="utf-8") as f:
        return f.read()


def reqp(r: Request):
    return r.headers["X-Real-IP"], r.url.path, r.method


@app.get("/css/{filename}")
async def staticcss(filename: str):
    try:
        if filename[-3:] == "css":
            return PlainTextResponse(content(file_path=filename), media_type="text/css")
        else:
            raise HTTPException(404)
    except:
        raise HTTPException(404)


@app.get("/js/{filename}")
async def staticjs(filename: str):
    try:
        if filename[-6:] == "raw.js":
            raise HTTPException(404)
        if filename[-2:] == "js":
            return PlainTextResponse(content(file_path=filename), media_type="text/javascript", headers={"Cache-Control": "no-store"})
        else:
            raise HTTPException(404)
    except:
        raise HTTPException(404)


@app.get("/img/{filename}")
async def staticimg(filename: str):
    try:
        if filename[-3:] == "png":
            return FileResponse(f"static/img/{filename}")
        elif filename[-3:] == "jpg":
            return FileResponse(f"static/img/{filename}")
        else:
            raise HTTPException(404)
    except:
        raise HTTPException(404)


@app.get("/favicon.ico")
async def favicon():
    return FileResponse(f"static/img/logo-tight.png")

#####
#
#  API ( DB Operations )
#
#####


@app.get("/xhr/trs")
def root(request: Request, t: str, db: Session = Depends(get_db)):
    s = checkSess(db, request)
    if s:
        log(db, *reqp(request), s.sid, 0, None)
    else:
        log(db, *reqp(request), None, None, None)
    tt = t_get(db, t)
    if tt is None:
        raise HTTPException(400)
    if tt.redeem == 0:
        stu = []
    elif tt.redeem == 1:
        stu = [tt.uid]
    else:
        stu = tt.uid.split(",")
    return JSONResponse(content={"amnt": tt.amnt2 if tt.redeem >= 2 else tt.amnt1, "rank": tt.redeem+1, "pos": tt.pos})


@app.get("/xhr/usr")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess:
        log(db, *reqp(request), sess.sid, 0, None)
        usr = sess.owner
        return JSONResponse(content={"email": usr.email, "name": usr.name, "ano": usr.account_number, "balance": usr.balance})
    else:
        raise HTTPException(400)


@app.get("/xhr/rcpt")
def root(request: Request, t: str, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess:
        log(db, *reqp(request), sess.sid, 0, None)
        usr = sess.owner
        t = get_trans(db, t)
        if t is None or (t.owner.uid != usr.uid and t.issued_by != usr.uid):
            raise HTTPException(400)
        return JSONResponse(content={
            "tid": t.tid,
            "timestamp": (t.timestamp+timedelta(hours=9)).strftime("%Y/%m/%d, %H:%M:%S"),
            "amount": t.amount,
            "description": t.description,
            "issuer_type": t.issuer_type,
            "approved": "취소" if t.approved_by == "cancel" else ("승인" if t.approved else "대기중"),
            "reciept": get_receipt(db, t.tid) or ""
        })
    else:
        raise HTTPException(400)


@app.post("/xhr/qn")
def root(request: Request, db: Session = Depends(get_db), ano: str = Form(...)):
    sess = checkSess(db, request)
    if sess:
        log(db, *reqp(request), sess.sid, 0, json.dumps({"ano": ano}))
        usr = sess.owner
        if len(ano) != 8:
            raise HTTPException(400)
        usr2 = get_user_by_ano(db, ano)
        if usr2 is None:
            raise HTTPException(400)
        return JSONResponse(content={"email": usr2.email, "name": usr2.name})
    else:
        raise HTTPException(400)


@app.post("/xhr/sd")
def root(request: Request, db: Session = Depends(get_db), ano: str = Form(...), amnt: int = Form(...), desc: str = Form(...)):
    sess = checkSess(db, request)
    if sess:
        log(db, *reqp(request), sess.sid, 0,
            json.dumps({"ano": ano, "amnt": amnt, "desc": desc}))
        usr = sess.owner
        if len(ano) != 8:
            raise HTTPException(400)
        usr2 = get_user_by_ano(db, ano)
        if usr2 is None:
            raise HTTPException(400)
        if usr2.uid == usr.uid:
            raise HTTPException(400)
        if amnt > usr.balance or usr.balance <= 0 or amnt<=0:
            raise HTTPException(400)
        if len(desc) > 10 or len(desc) < 1:
            raise HTTPException(400)
        trans = TransactionBase(
            owner_id=usr2.uid, amount=amnt, description=desc,
            issuer_type=1, issued_by=usr.uid,
            approved=True, approved_by="system"
        )
        t = generate_transaction(db, trans, None)
        trans = TransactionBase(
            owner_id=usr.uid, amount=-1*amnt, description=desc,
            issuer_type=1, issued_by=usr2.uid,
            approved=True, approved_by="system"
        )
        t = generate_transaction(db, trans, t)
        update_balance(db, usr, -1*amnt)
        update_balance(db, usr2, amnt)
        return JSONResponse(content={"tid": t.tid})
    else:
        raise HTTPException(400)


@app.post("/xhr/rcd")
def root(request: Request, db: Session = Depends(get_db), s: int = Form(...), n: int = Form(...)):
    sess = checkSess(db, request)
    if sess:
        log(db, *reqp(request), sess.sid, 0, json.dumps({"s": s, "n": n}))
        usr = sess.owner
        ts = usr.transactions
        if min(len(ts), s) == min(len(ts), s+n):
            return JSONResponse(content={})
        ts = ts[::-1]
        ts = ts[min(len(ts), s):min(len(ts), s+n)]
        tr = []
        for t in ts:
            tr.append(
                {
                    "tid": t.tid,
                    "time": (t.timestamp+timedelta(hours=9)).strftime("%Y/%m/%d, %H:%M:%S"),
                    "desc": t.description,
                    "amnt": t.amount,
                    "apvd": "취소" if t.approved_by == "cancel" else ("승인" if t.approved else "대기중")
                }
            )
        return JSONResponse(content=tr)
    else:
        raise HTTPException(400)


@app.get("/xhr/rt")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess:
        log(db, *reqp(request), sess.sid, 0, None)
        usr = sess.owner
        tkn = get_token(db, usr)
        if tkn:
            return JSONResponse(content={"tid": tkn.tid, "timestamp": tkn.timestamp.timestamp()})
    raise HTTPException(400)

####################


@app.get("/axhr/ai")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess:
        log(db, *reqp(request), sess.sid, 1)
        usr = sess.owner
        return JSONResponse(content={"name": usr.name})
    raise HTTPException(400)


@app.post("/axhr/p/gr")
def root(request: Request, db: Session = Depends(get_db), data: str = Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype == 2:
        log(db, *reqp(request), sess.sid, 1, data)
        data = json.loads(data)
        if not "desc" in data:
            raise HTTPException(400)
        desc = data["desc"]
        if len(desc) > 10 or len(desc) < 1:
            raise HTTPException(400)
        if not "stuid" in data:
            raise HTTPException(400)
        if not "amnt" in data:
            raise HTTPException(400)
        if int(data["amnt"]) <= 0:
            raise HTTPException(400)
        i = 0
        for stid in set(data["stuid"]):
            st = get_user_by_email(db, f"{stid}@ksa.hs.kr")
            if st:
                trans = TransactionBase(
                    owner_id=st.uid, amount=data["amnt"], description=f"[{sess.owner.name}] {desc}",
                    issuer_type=3, issued_by=sess.owner.uid,
                    approved=False, approved_by=sess.owner.uid
                )
                tt = generate_transaction(db, trans, None)
                p_append(db, tt.tid)
                i += 1
        return JSONResponse(content={"count": i})
    raise HTTPException(400)


@app.post("/axhr/s/scan")
def root(request: Request, db: Session = Depends(get_db), sid: str = Form(...), txt: str = Form(...)):
    sess = verify_asession(db, sid)
    if sess and sess.owner.actype == 1:
        log(db, *reqp(request), sess.sid, 1,
            json.dumps({"sid": sid, "txt": txt}))
        l = s_add(db, sid, txt)
        return JSONResponse(content={"res": "suc" if l else "fail"}, headers={'Access-Control-Allow-Origin': '*'})
    raise HTTPException(400)


@app.get("/axhr/s/menu")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype == 1:
        log(db, *reqp(request), sess.sid, 1, None)
        name = sess.owner.uid
        try:
            return JSONResponse(content=json.loads(content(file_path=f"{name}.json")))
        except:
            raise HTTPException(404)
    raise HTTPException(400)


@app.get("/axhr/s/tint")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype == 1:
        log(db, *reqp(request), sess.sid, 1, None)
        s_get(db, sess.sid)
        return JSONResponse(content={"result": "success"})
    raise HTTPException(400)


@app.post("/axhr/s/tintext")
def root(request: Request, db: Session = Depends(get_db), data: str = Form(...)):
    data = json.loads(data)
    sess = verify_asession(db, data["sid"])
    if sess is None or not sess.owner.uid == "kl4c":
        raise Exception(404)
    log(db, *reqp(request), sess.sid, 1, str(data))
    if sess and sess.owner.actype == 1:
        s_get(db, sess.sid)
        return JSONResponse(content={"result": "success"}, headers={'Access-Control-Allow-Origin': '*'})
    raise HTTPException(400)


@app.post("/axhr/s/tpay")
def root(request: Request, db: Session = Depends(get_db), data: str = Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype == 1:
        log(db, *reqp(request), sess.sid, 1, data)
        data = json.loads(data)
        tot = 0
        for d in data:
            tot += d["mprice"] * d["mcnt"]
        if tot <= 0:
            # 금액 오류
            return JSONResponse(content={"result": "fail", "detail": 4})
        s = s_get(db, sess.sid)
        if s is None:
            # not scanned yet
            return JSONResponse(content={"result": "fail", "detail": 1})
        tkn = query_token(db, s[0])
        if tkn.timestamp + timedelta(seconds=30) < s[1]:
            # token expired
            return JSONResponse(content={"result": "fail", "detail": 2})
        owner = tkn.owner
        if tot > owner.balance:
            # 잔액 부족
            return JSONResponse(content={"result": "fail", "detail": 3})
        update_balance(db, owner, -1*tot)
        trans = TransactionBase(
            owner_id=owner.uid, amount=-1*tot, description=f"[{sess.owner.name}] 구매",
            issuer_type=2, issued_by=sess.owner.uid,
            approved=True, approved_by="system"
        )
        ndata = []
        for d in data:
            ndata.append({
                "mname": d["mname"],
                "mcnt": d["mcnt"],
                "mprice": d["mprice"],
            })
        tt = generate_transaction_sell(db, trans, ndata)
        # 잔액 부족
        return JSONResponse(content={"result": "success", "detail": 0})
    raise HTTPException(400)


@app.post("/axhr/s/tpayext")
def root(request: Request, db: Session = Depends(get_db), data: str = Form(...), sid: str = Form(...)):
    data = json.loads(data)
    sess = verify_asession(db, sid)
    if sess is None or not sess.owner.uid == "kl4c":
        raise Exception(404)
    log(db, *reqp(request), sess.sid, 1, None)
    if sess and sess.owner.actype == 1:
        tot = 0
        for d in data:
            tot += d["mprice"] * d["mcnt"]
        if tot <= 0:
            # 금액 오류
            return JSONResponse(content={"result": "fail", "detail": 4}, headers={'Access-Control-Allow-Origin': '*'})
        s = s_get(db, sess.sid)
        if s is None:
            # not scanned yet
            return JSONResponse(content={"result": "fail", "detail": 1}, headers={'Access-Control-Allow-Origin': '*'})
        tkn = query_token(db, s[0])
        if tkn.timestamp + timedelta(seconds=30) < s[1]:
            # token expired
            return JSONResponse(content={"result": "fail", "detail": 2}, headers={'Access-Control-Allow-Origin': '*'})
        owner = tkn.owner
        if tot > owner.balance:
            # 잔액 부족
            return JSONResponse(content={"result": "fail", "detail": 3}, headers={'Access-Control-Allow-Origin': '*'})
        update_balance(db, owner, -1*tot)
        trans = TransactionBase(
            owner_id=owner.uid, amount=-1*tot, description=f"[{sess.owner.name}] 구매",
            issuer_type=2, issued_by=sess.owner.uid,
            approved=True, approved_by="system"
        )
        ndata = []
        for d in data:
            ndata.append({
                "mname": d["mname"],
                "mcnt": d["mcnt"],
                "mprice": d["mprice"],
            })
        tt = generate_transaction_sell(db, trans, ndata)
        return JSONResponse(content={"result": "success", "detail": 0}, headers={'Access-Control-Allow-Origin': '*'})
    raise HTTPException(400)

####################


@app.get("/sxhr/aa")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [4, 7]:
        log(db, *reqp(request), sess.sid, 1, None)
        a, b = get_admin(db)
        return JSONResponse(content=[{
            "uid": item.uid,
            "name": item.name,
            "actype": item.actype
        } for item in a] + [{
            "uid": item.uid,
            "name": item.name,
            "actype": item.actype
        } for item in b])
    raise HTTPException(400)


@app.get("/sxhr/at")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [4, 7]:
        log(db, *reqp(request), sess.sid, 1, None)
        d = p_all(db)
        l = []
        for i in d:
            i = get_trans(db, i.tid)
            l.append({
                "name": f"{i.owner.email[:6]} {i.owner.name}",
                "desc": i.description,
                "amnt": i.amount,
                "tid":  i.tid,
            })
        return JSONResponse(content=l)
    raise HTTPException(400)


@app.post("/sxhr/aprv")
def root(request: Request, db: Session = Depends(get_db), data=Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [4, 7]:
        log(db, *reqp(request), sess.sid, 1, data)
        aprv(db, data, sess.owner.uid)
        return JSONResponse(content={"res": "suc"})
    raise HTTPException(400)


@app.post("/sxhr/deny")
def root(request: Request, db: Session = Depends(get_db), data=Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [4, 7]:
        log(db, *reqp(request), sess.sid, 1, data)
        deny(db, data, sess.owner.uid)
        return JSONResponse(content={"res": "suc"})
    raise HTTPException(400)


@app.post("/sxhr/name")
def root(request: Request, db: Session = Depends(get_db), data=Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [4, 7]:
        log(db, *reqp(request), sess.sid, 1, data)
        j = json.loads(data)
        update_admin(db, j["uid"], name=j["dat"])
        return JSONResponse(content={"res": "suc"})
    raise HTTPException(400)


@app.post("/sxhr/pswd")
def root(request: Request, db: Session = Depends(get_db), data=Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [7]:
        log(db, *reqp(request), sess.sid, 1, data)
        j = json.loads(data)
        update_admin(db, j["uid"], pw=j["dat"])
        return JSONResponse(content={"res": "suc"})
    raise HTTPException(400)


@app.get("/sxhr/rprt")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [4, 7]:
        log(db, *reqp(request), sess.sid, 1, None)
        r = {}
        r["date"] = (datetime.now()+timedelta(hours=9)
                     ).strftime('%m/%d %H:%M:%S')
        a0, b0, c0 = abc(db, 1), abc(db, 2), abc(db, 3)
        a, b, c = [], [], []
        if a0 is not None:
            for a1 in a0:
                a.append({
                    "stid": a1.email[:6],
                    "name": a1.name,
                    "acid": a1.account_number,
                    "blce": a1.balance
                })
        if b0 is not None:
            for b1 in b0:
                b.append({
                    "time": (b1.timestamp+timedelta(hours=9)).strftime('%m/%d %H:%M:%S'),
                    "prgm": adm_uid_to_name(db, b1.issued_by) if b1.issuer_type == 3 else "보물찾기",
                    "stid": b1.owner.email[:6],
                    "resn": b1.description,
                    "amnt": b1.amount,
                    "apvd": b1.approved,
                    "apby": b1.approved_by
                })
        if c0 is not None:
            for c1 in c0:
                c.append({
                    "time": (c1.timestamp+timedelta(hours=9)).strftime('%m/%d %H:%M:%S'),
                    "prgm": c1.issued_by,
                    "stid": c1.owner.email[:6],
                    "amnt": c1.amount,
                    "rcpt": get_receipt(db, c1.tid)
                })
        r["a"] = a
        r["b"] = b
        r["c"] = c
        return JSONResponse(content=r)
    raise HTTPException(400)


@app.post("/sxhr/atrs")  # add
def root(request: Request, db: Session = Depends(get_db), data=Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [3, 4, 7]:
        log(db, *reqp(request), sess.sid, 1, data)
        tt = t_append(db, *(data.split(",")))
        return JSONResponse(content={"t": tt.tid})
    raise HTTPException(400)


@app.get("/sxhr/xtrs")  # all
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [3, 4, 7]:
        log(db, *reqp(request), sess.sid, 1, None)
        tt = t_all(db)
        l = []
        for t in tt:
            if not t.active:
                continue
            if t.redeem == 0:
                stu = []
            elif t.redeem == 1:
                stu = [t.uid]
            else:
                stu = t.uid.split(",")
            l.append({
                "tid": t.tid,
                "pos": t.pos,
                "amnt1": t.amnt1,
                "amnt2": t.amnt2,
                "redeem": t.redeem,
                "stuid": ",".join([get_user_by_uid(db, s).email[:6] for s in stu]) if t.uid else ""
            })
        return JSONResponse(content=l)
    raise HTTPException(400)


@app.post("/sxhr/dtrs")  # del
def root(request: Request, db: Session = Depends(get_db), data=Form(...)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype in [3, 4, 7]:
        log(db, *reqp(request), sess.sid, 1, data)
        try:
            t_del(db, data)
        except:
            JSONResponse(content={"res": "fail"})
        else:
            return JSONResponse(content={"res": "suc"})
    raise HTTPException(400)


@app.get("/sxhr/genac_7X2bd")
def root(request: Request, id: str, pw: str, tp: str, nm: str, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype == 7:
        add_admin(db, id, pw, nm, tp)
        return PlainTextResponse(content="SUC")
    raise HTTPException(404)


@app.get("/sxhr/collect_7X2bd")
def root(request: Request, tot: str, stuid: str, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess and sess.owner.actype == 7:
        tot = int(tot)
        owner = get_user_by_email(db, stuid+"@ksa.hs.kr")
        if tot > owner.balance:
            # 잔액 부족
            return PlainTextResponse(content="NOBAL")
        update_balance(db, owner, -1*tot)
        trans = TransactionBase(
            owner_id=owner.uid, amount=-1*tot, description=f"[{sess.owner.name}] 구매",
            issuer_type=2, issued_by=sess.owner.uid,
            approved=True, approved_by="system"
        )
        ndata = [{
                "mname": "회수",
                "mcnt": 1,
                "mprice": tot,
            }]
        tt = generate_transaction_sell(db, trans, ndata)
        return PlainTextResponse(content="SUC")
    raise HTTPException(404)


#####
#
#  Routes
#
#####

GOOGLE_CLIENT_ID = os.environ.get(
    "GOOGLE_CLIENT_ID", 'SECRET')
GOOGLE_CLIENT_SECRET = os.environ.get(
    "GOOGLE_CLIENT_SECRET", 'SECRET')
GOOGLE_DISCOVERY_URL = (
    "https://accounts.google.com/.well-known/openid-configuration"
)
client = WebApplicationClient(GOOGLE_CLIENT_ID)


def get_google_provider_cfg():
    return requests.get(GOOGLE_DISCOVERY_URL).json()


REALBASEURL = "https://sacpay.ksaidev.com/"


@app.get("/")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 0, None)
        return RedirectResponse("/home", status_code=303)
    log(db, *reqp(request), None, None, None)
    return RedirectResponse("/login", status_code=303)


@app.get("/login")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 10, None)
        return RedirectResponse("/home", status_code=303)
    log(db, *reqp(request), None, None, None)
    return HTMLResponse(content=content("login.html"))


@app.get("/login/gauth")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 0, None)
        return RedirectResponse("/home", status_code=303)
    log(db, *reqp(request), None, None, None)
    google_provider_cfg = get_google_provider_cfg()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]
    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=REALBASEURL+"login/gauth/red",
        scope=["openid", "email", "profile"],
    )
    return RedirectResponse(request_uri)


@app.get("/login/gauth/red")
def root(request: Request, db: Session = Depends(get_db)):
    code = request.get("code")
    google_provider_cfg = get_google_provider_cfg()
    token_endpoint = google_provider_cfg["token_endpoint"]
    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url._url.replace(
            request.base_url._url, REALBASEURL),
        redirect_url=REALBASEURL+"login/gauth/red",
        code=code
    )
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
    )
    client.parse_request_body_response(json.dumps(token_response.json()))
    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body)
    if userinfo_response.json().get("email_verified"):
        unique_id = userinfo_response.json()["sub"]
        users_email = userinfo_response.json()["email"]
        picture = userinfo_response.json()["picture"]
        users_name = userinfo_response.json()["given_name"]
    else:
        log(db, *reqp(request), None, None, "f=1")
        return RedirectResponse("/login?f=1", status_code=303)
    if users_email.split("@")[1] != "ksa.hs.kr":
        log(db, *reqp(request), None, None, f"f=2;{users_email}")
        return RedirectResponse("/login?f=2", status_code=303)
    # register info to pass
    sess = login(db, users_email)
    if sess is None:
        log(db, *reqp(request), None, None, f"f=3;{users_email}")
        return RedirectResponse("/login?f=3", status_code=303)
    response = RedirectResponse("/home", status_code=303)
    if sess.owner.email[3] == "2":
        response.set_cookie(key="-sp-lang", value="en", secure=True, samesite="none", path="/")
    else:
        response.set_cookie(key="-sp-lang", value="ko", secure=True, samesite="none", path="/")
    response.set_cookie(key="-sp-session", value=sess.sid, max_age=2147483647,
                        domain="sacpay.ksaidev.com", secure=True, samesite="none", path="/")
    log(db, *reqp(request), sess.sid, 0, None)
    return response


@app.get("/logout")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 0, None)
    else:
        log(db, *reqp(request), None, None, None)
        return RedirectResponse("/login")
    response = RedirectResponse("/login", headers={"Cache-Control": "no-store"})
    response.status_code = 303
    response.delete_cookie(
        key="-sp-session", domain="sacpay.ksaidev.com", secure=True, samesite="none", path="/")
    return response


@app.get("/home")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is None:
        log(db, *reqp(request), None, None, None)
        return RedirectResponse("/login", status_code=303)
    log(db, *reqp(request), sess.sid, 0, None)
    return HTMLResponse(content=content("home.html"))


@app.get("/rcpt")
def root(request: Request, t: str, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is None:
        log(db, *reqp(request), None, None, None)
        return RedirectResponse("/login", status_code=303)
    log(db, *reqp(request), sess.sid, 0, None)
    t = get_trans(db, t)
    if t is None or (t.owner.uid != sess.owner.uid and t.issued_by != sess.owner.uid):
        raise HTTPException(404)
    return HTMLResponse(content=content("rcpt.html"))


@app.get("/record")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is None:
        log(db, *reqp(request), None, None, None)
        return RedirectResponse("/login", status_code=303)
    log(db, *reqp(request), sess.sid, 0, None)
    return HTMLResponse(content=content("record.html"))


@app.get("/send")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is None:
        log(db, *reqp(request), None, None, None)
        return RedirectResponse("/login", status_code=303)
    log(db, *reqp(request), sess.sid, 0, None)
    return HTMLResponse(content=content("send.html"))


@app.get("/pay")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is None:
        log(db, *reqp(request), None, None, None)
        return RedirectResponse("/login", status_code=303)
    log(db, *reqp(request), sess.sid, 0, None)
    return HTMLResponse(content=content("pay.html"))


@app.get("/treasure")
def root(request: Request, t: str, db: Session = Depends(get_db)):
    tt = t_get(db, t)
    if tt is None or not tt.active:
        raise HTTPException(404)
    sess = checkSess(db, request)
    if sess is None:
        log(db, *reqp(request), None, None, None)
        return RedirectResponse(f"/treasurelgn?t={t}", status_code=303)
    if tt.redeem == 0:
        stu = []
    elif tt.redeem == 1:
        stu = [tt.uid]
    else:
        stu = tt.uid.split(",")
    if sess.owner.uid in stu:
        log(db, *reqp(request), sess.sid, 0, None)
        raise HTTPException(404)
    log(db, *reqp(request), sess.sid, 0, None)
    return HTMLResponse(content=content("treasure.html"))


@app.get("/treasurelgn")
def root(request: Request, t: str, db: Session = Depends(get_db)):
    tt = t_get(db, t)
    if tt is None or not tt.active:
        raise HTTPException(404)
    sess = checkSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 0, None)
        raise HTTPException(404)
    log(db, *reqp(request), None, None, None)
    return HTMLResponse(content=content("treasurenl.html"))


@app.get("/treasurergs")
def root(request: Request, t: str, db: Session = Depends(get_db)):
    tt = t_get(db, t)
    if tt is None:
        raise HTTPException(404)
    if not tt.active:
        raise HTTPException(404)
    sess = checkSess(db, request)
    if sess is None:
        log(db, *reqp(request), None, None, f"t={t}")
        return RedirectResponse(f"/treasurelgn?t={t}", status_code=303)
    if tt.redeem == 0:
        stu = []
    elif tt.redeem == 1:
        stu = [tt.uid]
    else:
        stu = tt.uid.split(",")
    if sess.owner.uid in stu:
        log(db, *reqp(request), sess.sid, 0, f"t={t}")
        return RedirectResponse(f"/home", status_code=303)
    t_use(db, t, sess.owner)
    log(db, *reqp(request), sess.sid, 0, f"t={t}")
    return RedirectResponse(f"/home", status_code=303)


@app.get("/terms")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 0, None)
    else:
        log(db, *reqp(request), None, None, None)
    return HTMLResponse(content=content("terms.html"))


@app.get("/alogin")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 0, None)
        if sess.owner.actype == 1:
            response = RedirectResponse("/seller", status_code=303)
        elif sess.owner.actype == 2:
            response = RedirectResponse("/program", status_code=303)
        elif sess.owner.actype == 3:
            response = RedirectResponse("/tkn", status_code=303)
        elif sess.owner.actype == 4:
            response = RedirectResponse("/super", status_code=303)
        elif sess.owner.actype == 7:
            response = RedirectResponse("/super", status_code=303)
        else:
            raise HTTPException(500)
        return response
    log(db, *reqp(request), None, None, None)
    return HTMLResponse(content=content("alogin.html"))


@app.post("/alogin")
def root(request: Request, db: Session = Depends(get_db), uid=Form(...), upw=Form(...)):
    log(db, *reqp(request), None, None, json.dumps({"uid": uid, "upw": upw}))
    sess = admin_login(db, uid, upw)
    if sess is None:
        return RedirectResponse("/alogin?f=1", status_code=303)
    if sess.owner.actype == 1:
        response = RedirectResponse("/seller", status_code=303)
    elif sess.owner.actype == 2:
        response = RedirectResponse("/program", status_code=303)
    elif sess.owner.actype == 3:
        response = RedirectResponse("/tkn", status_code=303)
    elif sess.owner.actype == 4:
        response = RedirectResponse("/super", status_code=303)
    elif sess.owner.actype == 7:
        response = RedirectResponse("/super", status_code=303)
    else:
        raise HTTPException(500)
    response.set_cookie(key="-sp-admin-session", value=sess.sid, max_age=2147483647,
                        domain="sacpay.ksaidev.com", secure=True, samesite="none", path="/")
    return response


@app.post("/aloginkl4c")
def root(request: Request, db: Session = Depends(get_db), uid=Form(...), upw=Form(...)):
    if uid != "kl4c":
        raise HTTPException(404)
    log(db, *reqp(request), None, None, json.dumps({"uid": uid, "upw": upw}))
    sess = admin_login(db, uid, upw)
    return PlainTextResponse(sess.sid)


@app.get("/alogout")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 1, None)
    else:
        log(db, *reqp(request), None, None, None)
        return RedirectResponse("/alogin")
    response = RedirectResponse("/alogin",headers={"Cache-Control": "no-store"})
    response.status_code = 303
    response.delete_cookie(key="-sp-admin-session",
                           domain="sacpay.ksaidev.com", secure=True, samesite="none", path="/")
    return response


@app.get("/seller")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess is None or sess.owner.actype != 1:
        raise HTTPException(404)
    log(db, *reqp(request), sess.sid, 1, None)
    return HTMLResponse(content=content("admin-sell.html"))


@app.get("/program")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess is None or sess.owner.actype != 2:
        raise HTTPException(404)
    log(db, *reqp(request), sess.sid, 1, None)
    return HTMLResponse(content=content("admin-give.html"))


@app.get("/super")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess is None or sess.owner.actype not in [4, 7]:
        raise HTTPException(404)
    log(db, *reqp(request), sess.sid, 1, None)
    return HTMLResponse(content=content("sadmin.html"))


@app.get("/scanner")
def root(request: Request, sid: str, db: Session = Depends(get_db)):
    sess = verify_asession(db, sid)
    if sess is None or sess.owner.actype != 1:
        raise HTTPException(404)
    log(db, *reqp(request), sess.sid, 1, None)
    return HTMLResponse(content=content("scanner.html"))


@app.get("/tkn")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess is None or sess.owner.actype not in [3, 4, 7]:
        raise HTTPException(404)
    log(db, *reqp(request), sess.sid, 1, None)
    return HTMLResponse(content=content("tkn.html"))


@app.get("/dbg")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 0, None)
    log(db, *reqp(request), None, None, None)
    return HTMLResponse(content=content("dbg.html"))


@app.get("/report")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkAdminSess(db, request)
    if sess is None or sess.owner.actype not in [4, 7]:
        raise HTTPException(404)
    log(db, *reqp(request), sess.sid, 1, None)
    return HTMLResponse(content=content("report.html"))


@app.get("/reg")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 0, None)
    log(db, *reqp(request), None, None, None)
    return RedirectResponse("https://link")


@app.get("/notmobile")
def root(request: Request, db: Session = Depends(get_db)):
    sess = checkSess(db, request)
    if sess is not None:
        log(db, *reqp(request), sess.sid, 0, None)
    log(db, *reqp(request), None, None, None)
    return PlainTextResponse("SAC Pay는 모바일에서만 사용 가능합니다.")

@app.exception_handler(OE1)
def root(request: Request, exc: OE1):
    if request.url.path.startswith("/xhr") or request.url.path.startswith("/axhr") or request.url.path.startswith("/sxhr"):
        return RedirectResponse(request.url.path)
    return HTMLResponse(content="<html><head></head><body>접속이 지연되고 있습니다. 잠시만 기다려주세요.<script>location.reload();</script></body></html>", status_code=503)


@app.exception_handler(OE2)
def root(request: Request, exc: OE2):
    if request.url.path.startswith("/xhr") or request.url.path.startswith("/axhr") or request.url.path.startswith("/sxhr"):
        return RedirectResponse(request.url.path)
    return HTMLResponse(content="<html><head></head><body>접속이 지연되고 있습니다. 잠시만 기다려주세요.<script>location.reload();</script></body></html>", status_code=503)


@app.exception_handler(400)
def root(request: Request, exc: Exception):
    db = next(get_db())
    s = checkSess(db, request)
    if s:
        log(db, *reqp(request), s.sid, 0, None)
        return PlainTextResponse('{"detail":"Bad Request"}', status_code=400)
    ss = checkAdminSess(db, request)
    if ss:
        log(db, *reqp(request), ss.sid, 1, None)
        return PlainTextResponse('{"detail":"Bad Request"}', status_code=400)
    log(db, *reqp(request), None, None, None)
    return PlainTextResponse('{"detail":"Bad Request"}', status_code=400)


@app.exception_handler(404)
def root(request: Request, exc: Exception):
    db = next(get_db())
    s = checkSess(db, request)
    if s:
        log(db, *reqp(request), s.sid, 0, None)
        return PlainTextResponse('{"detail":"Not Found"}', status_code=400)
    ss = checkAdminSess(db, request)
    if ss:
        log(db, *reqp(request), ss.sid, 1, None)
        return PlainTextResponse('{"detail":"Not Found"}', status_code=400)
    log(db, *reqp(request), None, None, None)
    return PlainTextResponse('{"detail":"Not Found"}', status_code=400)
