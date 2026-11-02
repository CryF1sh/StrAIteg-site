#!/bin/sh
# Сообщает Яндексу и Bing (а через Bing — ChatGPT и Copilot) об обновлении страниц.
# Запуск после обновления сайта:  sh /var/www/straitegist-landings/deploy/indexnow.sh
cd "$(dirname "$0")/.." || exit 1
KEY=$(ls | grep -E '^[0-9a-f]{32}\.txt$' | head -1 | sed 's/\.txt$//')
[ -n "$KEY" ] || { echo "Нет файла ключа IndexNow"; exit 1; }
ping_host() {
  host=$1; shift
  urls=""; for u in "$@"; do urls="$urls\"https://$host$u\","; done
  body="{\"host\":\"$host\",\"key\":\"$KEY\",\"keyLocation\":\"https://$host/$KEY.txt\",\"urlList\":[${urls%,}]}"
  for ep in https://yandex.com/indexnow https://api.indexnow.org/indexnow; do
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$ep" -H "Content-Type: application/json; charset=utf-8" -d "$body")
    echo "$host → $ep: $code"
  done
}
ping_host factory.straitegist.ru / /en/ /privacy/ /en/privacy/
ping_host vendors.straitegist.ru / /en/
echo "200 или 202 — принято. 403 — ключ не найден на сайте (проверьте, что git pull выполнен)."
