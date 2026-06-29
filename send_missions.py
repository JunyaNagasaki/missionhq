import json, urllib.request

with open('missions.json', encoding='utf-8') as f:
    data = json.load(f)

url = 'https://dreamy-strudel-2ef597.netlify.app/.netlify/functions/set-missions'
all_ok = True
for day in data:
    body = json.dumps(day, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(url, data=body,
        headers={'Content-Type': 'application/json'}, method='POST')
    try:
        res = urllib.request.urlopen(req)
        print(f"OK {day['date']}: {res.read().decode()}")
    except Exception as e:
        print(f"NG {day['date']}: {e}")
        all_ok = False

if not all_ok:
    raise SystemExit(1)
