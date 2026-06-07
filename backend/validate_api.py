import requests
base = 'http://localhost:8000'
tests = [
    ('GET', '/api/health', None),
    ('GET', '/api/workflows', None),
    ('GET', '/api/executions', None),
    ('GET', '/api/analytics', None),
    ('GET', '/api/alerts', None),
    ('GET', '/api/templates', None),
    ('GET', '/api/integrations', None),
    ('POST', '/api/auth/login', {'username': 'admin', 'password': 'admin'}),
    ('GET', '/api/auth/me', None),
]
for method, path, body in tests:
    try:
        r = requests.request(method, base + path, json=body, timeout=5)
        d = r.json()
        if isinstance(d, dict) and 'items' in d:
            s = 'items=' + str(len(d['items']))
        else:
            s = str(d)[:120]
        print(method, path, r.status_code, s)
    except Exception as e:
        print('ERR', path, str(e))
