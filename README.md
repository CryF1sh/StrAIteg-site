# Сайт СтрAIтег: лендинги для производств и вендоров

Статический сайт без сборки. Один каталог обслуживает два поддомена:

| Адрес | Что открывается |
|---|---|
| `https://factory.straitegist.ru/` | лендинг для производств (`index.html`) |
| `https://vendors.straitegist.ru/` | лендинг для вендоров и интеграторов (`vendors/index.html`) |
| `https://straitegist.ru/` | сама платформа (кнопки «Войти» ведут на `https://straitegist.ru/?role=plant\|vendor`) |

Старый адрес `factory.straitegist.ru/vendors/` перенаправляется (301) на `vendors.straitegist.ru`.

## Структура

```
index.html             — лендинг для производств (factory.straitegist.ru)
vendors/index.html     — лендинг для вендоров (vendors.straitegist.ru)
privacy/index.html     — политика обработки ПД (/privacy/ на обоих поддоменах)
assets/                — стили, скрипт, логотип, превью, шрифты (общие для обоих поддоменов)
.htaccess              — маршрутизация по поддомену для Apache
SEO.md                 — ключевые запросы, индексация и запуск в поисковиках
llms.txt, llms-vendors.txt — описание сервиса для нейросетей (/llms.txt по поддомену)
<32 символа>.txt       — ключ IndexNow; deploy/indexnow.sh — уведомить Яндекс и Bing
deploy/nginx.conf      — конфиг nginx (копируется один раз)
deploy/nginx-site.conf, deploy/nginx-maps.conf — маршруты, подключаются из репозитория
robots.txt, sitemap.xml                  — для factory
robots-vendors.txt, sitemap-vendors.xml  — для vendors (отдаются как /robots.txt и /sitemap.xml)
```

Пути к файлам абсолютные (`/assets/...`), поэтому сайт работает только через веб-сервер, не при открытии файла с диска.

## Размещение

### DNS

Записи `straitegist.ru` (платформа) не трогаем. Добавить в зоне `straitegist.ru`:

| Имя | Тип | Значение |
|---|---|---|
| `factory` | A | IP-адрес хостинга, где лежит этот сайт |
| `vendors` | A | тот же IP-адрес |

Если хостинг даёт не IP, а технический адрес (например, `xxx.hosting.ru`), вместо A сделайте CNAME на этот адрес. `www.factory` и `www.vendors` не нужны. Если они уже есть, `.htaccess` перенаправит их на адрес без www.

### Хостинг

Оба поддомена должны смотреть в один и тот же каталог: корень этого репозитория.

- **Apache (Beget, Timeweb, REG.RU и т.п.)**: в панели добавьте поддомены `factory` и `vendors` и укажите обоим один каталог. Маршрутизацию сделает `.htaccess`. Выпустите SSL-сертификаты (Let's Encrypt) на оба поддомена и включите в панели редирект на HTTPS.
- **Свой сервер (Ubuntu + nginx)**: готовый конфиг `deploy/nginx.conf`, инструкция ниже.

### Запуск на своём сервере (Ubuntu + nginx)

```bash
sudo apt update && sudo apt install -y nginx git certbot python3-certbot-nginx
sudo git clone https://github.com/CryF1sh/StrAIteg-site.git /var/www/straitegist-landings
sudo cp /var/www/straitegist-landings/deploy/nginx.conf /etc/nginx/sites-available/straitegist-landings
sudo ln -s /etc/nginx/sites-available/straitegist-landings /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d factory.straitegist.ru -d vendors.straitegist.ru --redirect
```

`deploy/nginx.conf` копируется **только один раз**, при первой установке: certbot дописывает в скопированный файл HTTPS. Повторное копирование стирает HTTPS, и браузер покажет чужой сертификат (например, от другого сайта на этом сервере).

Обновить сайт после изменений в репозитории:

```bash
sudo git -C /var/www/straitegist-landings pull && sudo nginx -t && sudo systemctl reload nginx
```

Маршруты лежат в `deploy/nginx-site.conf` и `deploy/nginx-maps.conf`. nginx подключает их прямо из репозитория, поэтому они обновляются через `git pull`.

## Перед запуском: обязательные шаги

### 1. Заявки → n8n → Telegram

Форма отправляет JSON на webhook n8n (адрес в `assets/site.js`, `CONFIG.FORM_ENDPOINT`):

```
https://demetrax.ru/webhook/straitegist-lead
```

Workflow в n8n: **«СтрAIтег: заявки с сайта → Telegram»** (https://demetrax.ru/workflow/lCujUNeZRIp3GUXJ).
Схема: Webhook → «Собрать сообщение» (форматирует заявку в HTML) → проверка контакта → «Отправить в Telegram» → ответ сайту.

- Сайт получает `200 {"ok":true}`, если заявка ушла в Telegram, и показывает второй шаг формы.
- Если в заявке нет контакта, ответ 422. Если Telegram не принял сообщение (после 3 попыток), ответ 502, и сайт показывает запасной контакт.
- CORS разрешён только для `https://factory.straitegist.ru` и `https://vendors.straitegist.ru` (узел Webhook → Options → Allowed Origins).

Чтобы включить:

1. Создайте бота у @BotFather и скопируйте токен.
2. Создайте группу для заявок и добавьте в неё бота. Chat ID группы можно узнать через @getmyid_bot или @RawDataBot (у групп он начинается с `-100`).
3. В n8n откройте узел «Отправить в Telegram»: создайте учётку Telegram с токеном бота и впишите Chat ID.
4. Опубликуйте (активируйте) workflow. Без этого production-адрес webhook не работает.
5. Отправьте тестовую заявку с сайта.

Форма двухшаговая. Оба шага приходят с одинаковым `lead_id`, поэтому второй шаг в Telegram приходит отдельным сообщением «дополнение к заявке» с тем же ID.

Поля шага 1: `contact`, `messenger` (telegram | max | whatsapp | phone | email), `task` (производства), `company` (вендоры), `interest` (`sample`, если человек пришёл по кнопке «Скачать пример»).
Поля шага 2: `name`, `company`, `region`, `role` (производства) / `role`, `name`, `position`, `catalog` (вендоры).
Всегда приходят: `audience` (plant | vendor), `step`, `page`, `referrer`, `utm` (+ `yclid`), `sent_at`.

Если позже понадобится CRM, добавьте её узел в тот же workflow параллельно с Telegram.

### 2. Яндекс.Метрика

В `<head>` **обеих** страниц (`index.html`, `vendors/index.html`) замените `window.YM_ID = 0;` на номер счётчика. В Метрике создайте JavaScript-цели:

| Цель | Когда |
|---|---|
| `cta_click` | клик по любой оранжевой кнопке |
| `demo_preset` | выбор примера в демо |
| `demo_cta` | клик по кнопке под результатом демо |
| `sample_download` | клик «Скачать пример подбора (PDF)» |
| `form_step1` | заявка отправлена (основная конверсия) |
| `form_step2` | заявка дополнена |
| `faq_open` | открыт вопрос в FAQ |

### 3. Заполнить реальные данные

На сайте жёлтым выделены места, которые нужно заполнить: `[N]`, результат кейса, цитаты. Найти их все:

```
grep -rn 'class="ph"' index.html vendors/index.html
```

После заполнения уберите у этих элементов класс `ph`, иначе текст останется жёлтым.

Проверьте, что эти обещания соответствуют реальности: «подбор за 1 рабочий день», «вендоров подбираем по номенклатуре, референсам и региону», «данные не используются для обучения», «контакт получают только выбранные поставщики», «оплата не влияет на выдачу».

### 4. Почта и политика

Заведите ящик `info@straitegist.ru`. Он указан в контактах, футере и как запасной адрес при сбое формы.
Текст `privacy/index.html` нужно подготовить по 152-ФЗ.

## Что ещё можно сделать

- Пример подбора в PDF: сейчас кнопка «Скачать пример подбора» ведёт к форме (лид-магнит: файл получают за контакт). Когда PDF будет готов, его можно отправлять из бота или CRM автоматически по полю `interest = sample`.
- A/B-тест на `vendors.straitegist.ru`: «от 99 000 ₽» на странице против «прайс только за контакт».
- Иконки (Material Symbols) пока грузятся с Google Fonts. Если нужно убрать все внешние запросы, скачайте шрифт в `assets/fonts` и поменяйте ссылку в `<head>`.
