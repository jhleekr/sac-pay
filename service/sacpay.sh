#!/bin/bash
cd /var/www/sacpay
. /var/www/sacpay/venv/bin/activate
cd /var/www/sacpay/sacpay
pip install -r requirements.txt
gunicorn -k uvicorn.workers.UvicornWorker --access-logfile /var/www/sacpay/gunicorn-access.log main:app --bind 0.0.0.0:7925 --workers 8