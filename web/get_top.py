from requests import session
from json import loads, dumps
from time import sleep
from os.path import dirname, join

__path__ = dirname(__file__)
session = session()

with open(join(__path__, 'top.json'), 'wb') as f:
    data = dict(code = 404)

    i = 0
    while data['code'] != 200 and i != 20:
        data = loads(session.get(
            url = 'https://music.163.com/api/playlist/detail',
            params = dict(id = 3778678)
        ).content)
        i += 1
        sleep(i)

    print(f.write(dumps(data).encode('UTF-8')))

