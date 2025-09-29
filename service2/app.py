from flask import Flask, Response
import datetime, shutil, os, requests

app = Flask(__name__)

def iso_now():
    return datetime.datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'

def uptime_hours():
    try:
        with open('/proc/uptime') as f:
            seconds = float(f.readline().split()[0])
        hours = seconds / 3600
        return int(hours) if hours.is_integer() else round(hours, 2)
    except Exception:
        return 0

def free_disk_mb():
    try:
        u = shutil.disk_usage('/')
        return u.free // (1024 * 1024)
    except Exception:
        return 'unknown'

@app.route('/status')
def status():
    record = f"Timestamp2: {iso_now()}: uptime {uptime_hours()} hours, free disk in root: {free_disk_mb()} Mbytes"
    # ensure vstorage exists and append
    try:
        os.makedirs('/vstorage', exist_ok=True)
        with open('/vstorage/log.txt', 'a') as f:
            f.write(record + '\n')
    except Exception as e:
        app.logger.error('vStorage write failed: %s', e)

    # post to storage
    try:
        requests.post('http://storage:5001/log', data=record, headers={'Content-Type': 'text/plain'}, timeout=2)
    except Exception as e:
        app.logger.error('POST to storage failed: %s', e)

    return Response(record, mimetype='text/plain')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
