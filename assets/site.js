/* СтрAIтег — скрипт лендингов (производства и вендоры).
   Настройки — в блоке CONFIG ниже. Подробности — README.md. */
(function () {
  "use strict";

  /* ===================== CONFIG ===================== */
  var CONFIG = {
    // Куда отправлять заявки (POST, JSON): webhook n8n, workflow «СтрAIтег: заявки с сайта → Telegram»
    // n8n сам отправляет заявку в Telegram. Разрешённые источники (CORS) заданы в узле Webhook.
    FORM_ENDPOINT: "https://demetrax.ru/webhook/straitegist-lead",
    // Номер счётчика Яндекс.Метрики задаётся в <head> каждой страницы: window.YM_ID
    METRIKA_ID: window.YM_ID || 0,
    // Запасной адрес, если отправка не удалась
    FALLBACK_EMAIL: "archadait@yandex.ru"
  };

  var LANG = (document.documentElement.lang || "ru").slice(0, 2) === "en" ? "en" : "ru";
  function T(str) { return LANG === "en" && typeof I18N_EN !== "undefined" && I18N_EN[str] != null ? I18N_EN[str] : str; }
  /* ===================== Английская версия: перевод строк скрипта ===================== */
  var I18N_EN = {
    "Ткань в пресс": "Fabric into press",
    "Нужно автоматизировать укладку пропитанной ткани в вырубной пресс и извлечение готовых шайб. Сейчас 1 000 изделий в смену, позже до 2 000. Прессов четыре, рабочий стол хотим сохранить.": "We need to automate loading impregnated fabric into a die-cutting press and removing the finished washers. Currently 1,000 parts per shift, later up to 2,000. There are four presses, and we want to keep the existing work table.",
    "Операция": "Operation",
    "Укладка и извлечение": "Loading and unloading",
    "Материал": "Material",
    "Пропитанная ткань": "Impregnated fabric",
    "Объём": "Volume",
    "1 000–2 000 шт./смену": "1,000–2,000 parts/shift",
    "Оборудование": "Equipment",
    "4 вырубных пресса": "4 die-cutting presses",
    "Точность": "Accuracy",
    "Рифление по пресс-форме": "Ribbing must match the die",
    "Ограничение": "Constraint",
    "Сохранить стол": "Keep the work table",
    "6 кг, вылет 600 мм, ±0,02 мм, 4 оси": "6 kg, 600 mm reach, ±0.02 mm, 4 axes",
    "Точность укладки и темп до 2 000 шт. в смену, компактно встаёт в центр стола": "Placement accuracy and a rate of up to 2,000 parts per shift; fits compactly in the center of the table",
    "Дельта-робот, 3 кг": "Delta robot, 3 kg",
    "Класс оборудования": "Equipment class",
    "Быстрее, но рабочей зоны мало для четырёх прессов": "Faster, but the work envelope is too small for four presses",
    "Малогабаритный 6-осевой, 7 кг": "Compact 6-axis robot, 7 kg",
    "Справится, но лишние оси и выше цена": "Would work, but with extra axes and a higher price",
    "Поставщики SCARA-роботов": "SCARA robot suppliers",
    "Есть модели с вылетом 600 мм и точностью ±0,02 мм": "Offer models with 600 mm reach and ±0.02 mm accuracy",
    "Интеграторы ячеек для прессов": "Press cell integrators",
    "Референсы по загрузке вырубных и штамповочных прессов": "References in die-cutting and stamping press loading",
    "3,8–5,9 млн ₽": "₽3.8–5.9M",
    "4–6 мес.": "4–6 mo.",
    "11–16 мес.": "11–16 mo.",
    "Окупаемость при высвобождении 4 операторов и ФОТ 90 тыс. ₽ в месяц на человека.": "Payback assumes 4 operators freed up at a labor cost of ₽90,000 per person per month.",
    "Мешки на паллеты": "Bags onto pallets",
    "В конце линии вручную укладываем мешки с сухой смесью по 25 кг на паллеты. Около 600 мешков в час, по два человека в смену, работаем в три смены.": "At the end of the line we stack 25 kg bags of dry mix onto pallets by hand. About 600 bags per hour, two people per shift, three shifts.",
    "Паллетизация мешков": "Bag palletizing",
    "Груз": "Load",
    "Мешки по 25 кг": "25 kg bags",
    "Темп": "Rate",
    "≈ 600 шт./час": "≈ 600 per hour",
    "Режим": "Schedule",
    "3 смены": "3 shifts",
    "Сейчас": "Now",
    "2 оператора в смену": "2 operators per shift",
    "Место": "Location",
    "Конец линии": "End of line",
    "Эйдос Робототехника A70-2180": "Eidos Robotics A70-2180",
    "70 кг, вылет 2 180 мм, 6 осей, IP54": "70 kg, 2,180 mm reach, 6 axes, IP54",
    "Запас по массе с учётом захвата, вылета хватает на две паллеты": "Payload margin including the gripper; reach covers two pallets",
    "Завод Роботов RusRobot RR 120-2900": "Zavod Robotov RusRobot RR 120-2900",
    "120 кг, вылет 2 900 мм": "120 kg, 2,900 mm reach",
    "Больший запас, если позже появятся мешки по 50 кг": "More margin if 50 kg bags come later",
    "Колонный паллетайзер": "Column palletizer",
    "Дешевле, но работает медленнее робота": "Cheaper, but slower than a robot",
    "Поставщики паллетайзеров": "Palletizer suppliers",
    "Роботы грузоподъёмностью от 50 кг, вилочные захваты для мешков": "Robots with 50 kg+ payload, fork grippers for bags",
    "Интеграторы упаковочных линий": "Packaging line integrators",
    "Ограждение ячейки, световой барьер, пусконаладка на месте": "Cell fencing, light curtain, on-site commissioning",
    "7–10 млн ₽": "₽7–10M",
    "3–5 мес.": "3–5 mo.",
    "15–21 мес.": "15–21 mo.",
    "Окупаемость при высвобождении 6 операторов и ФОТ 80 тыс. ₽ в месяц на человека.": "Payback assumes 6 operators freed up at a labor cost of ₽80,000 per person per month.",
    "Загрузка станка ЧПУ": "CNC machine tending",
    "Токарный станок с ЧПУ, оператор вручную ставит заготовки до 8 кг. Цикл обработки около 4 минут. Хотим, чтобы станок работал и ночью без людей.": "A CNC lathe where the operator loads blanks of up to 8 kg by hand. The machining cycle is about 4 minutes. We want the machine to run at night without people.",
    "Загрузка станка": "Machine loading",
    "Заготовка": "Blank",
    "До 8 кг": "Up to 8 kg",
    "Цикл": "Cycle",
    "≈ 4 мин": "≈ 4 min",
    "Ночь без оператора": "Unattended night shift",
    "Токарный ЧПУ": "CNC lathe",
    "Требование": "Requirement",
    "Рядом с людьми днём": "Works next to people by day",
    "Коллаборативный робот, 10–12 кг": "Collaborative robot, 10–12 kg",
    "Работает рядом с людьми без ограждения, быстро перенастраивается": "Works next to people without fencing, quick changeover",
    "Промышленный 6-осевой, 12–20 кг": "Industrial 6-axis robot, 12–20 kg",
    "Быстрее, но нужны ограждение и больше места": "Faster, but needs fencing and more space",
    "Портальный загрузчик": "Gantry loader",
    "Хорош для больших серий, сложно встроить в действующий участок": "Good for large batches, hard to fit into an existing area",
    "Поставщики коботов": "Cobot suppliers",
    "Коллаборативные роботы 10–12 кг для работы рядом с людьми": "10–12 kg collaborative robots for work next to people",
    "Интеграторы ячеек для станков": "Machine tending cell integrators",
    "Опыт роботизации загрузки токарных станков с ЧПУ": "Experience automating CNC lathe loading",
    "3,5–5 млн ₽": "₽3.5–5M",
    "2–4 мес.": "2–4 mo.",
    "12–18 мес.": "12–18 mo.",
    "Окупаемость за счёт ночной смены без оператора: станок работает на треть дольше.": "Payback comes from an unattended night shift: the machine runs a third longer per day.",
    "Клиент, которого привёл СтрAIтег · описание задачи": "Customer brought by StrAItegist · task description",
    "SCARA, 6 кг, вылет 600 мм": "SCARA, 6 kg, 600 mm reach",
    "±0,02 мм, 4 оси, вакуумный захват": "±0.02 mm, 4 axes, vacuum gripper",
    "Альтернатива другого производителя": "Alternative from another manufacturer",
    "Ваш клиент · письмо на почту отдела продаж": "Your customer · email to the sales team",
    "Робот-паллетайзер, 70 кг": "Palletizing robot, 70 kg",
    "Вылет 2 180 мм, 6 осей, IP54": "2,180 mm reach, 6 axes, IP54",
    "Робот 120 кг, вылет 2 900 мм": "120 kg robot, 2,900 mm reach",
    "Ваш клиент · запрос с сайта": "Your customer · website inquiry",
    "Без ограждения, двойной захват": "No fencing, double gripper",
    "Под ключ": "Turnkey",
    "Срок внедрения": "Implementation",
    "Окупаемость": "Payback",
    "Новый запрос": "New request",
    "Платформа разбирает запрос": "Platform is analyzing the request",
    "ТКП готово к отправке": "Proposal ready to send",
    "Готов к работе": "Ready",
    "Разбираю задачу": "Analyzing the task",
    "Подбор готов": "Selection ready",
    "ваш каталог": "your catalog",
    "соответствие": "fit",
    "ТЗ в PDF": "Spec as PDF",
    "ТКП по вашему шаблону": "Proposal in your template",
    "Источники по каждой цифре": "Sources for every figure",
    "ТЗ: параметры извлечены автоматически": "Spec: parameters extracted automatically",
    "Разбираю запрос клиента и составляю ТЗ": "Reading the customer request and writing the spec",
    "Подобрано из вашего каталога": "Selected from your catalog",
    "Ищу подходящие позиции в вашем каталоге": "Searching your catalog for matching items",
    "Обоснование для клиента": "Justification for the customer",
    "Считаю стоимость, сроки и окупаемость": "Estimating cost, timeline and payback",
    "Готово к отправке": "Ready to send",
    "Собираю ТКП по вашему шаблону": "Building the proposal in your template",
    "Что мы поняли из описания": "What we understood from the description",
    "Извлекаю операцию, массу, темп и ограничения": "Extracting the operation, weight, rate and constraints",
    "3 варианта от разных производителей": "3 options from different manufacturers",
    "Сравниваю каталоги производителей по требованиям": "Comparing manufacturer catalogs against the requirements",
    "Кто поставит и внедрит": "Who will deliver and install",
    "· по номенклатуре, референсам и региону": "· by product range, references and region",
    "Ищу вендоров и интеграторов с похожими проектами": "Looking for vendors and integrators with similar projects",
    "Стоимость и окупаемость": "Cost and payback",
    "Считаю бюджет под ключ, сроки и окупаемость": "Estimating turnkey budget, timeline and payback",
    " Это пример. По вашей задаче подберём точно.": " This is an example. For your task we'll make an exact selection.",
    "Хотите такой же подбор по вашей задаче?": "Want a selection like this for your task?",
    "Оборудование и вендоры за 1 рабочий день, бесплатно": "Equipment and vendors in 1 business day, free",
    "Подобрать оборудование": "Find equipment",
    "Похожий пример из демо: ": "Closest demo example: ",
    ". По вашей задаче подберём точно.": ". For your task we'll make an exact selection.",
    "Этого запроса нет среди примеров демо": "This request isn't among the demo examples",
    "На пилоте платформа разберёт любой запрос ваших клиентов по вашему каталогу.": "In the pilot, the platform analyzes any of your customers' requests against your catalog.",
    "Запустить бесплатный пилот": "Start a free pilot",
    "Этой задачи нет среди примеров демо": "This task isn't among the demo examples",
    "Отправьте её нам: подберём оборудование и вендоров и пришлём результат за 1 рабочий день, бесплатно.": "Send it to us: we'll select equipment and vendors and send you the result within 1 business day, free.",
    "Отправить мою задачу": "Send my task",
    "Ник или телефон в Telegram": "Telegram username or phone",
    "@username или +7 900 000-00-00": "@username or +7 900 000-00-00",
    "Укажите ник в Telegram (@username) или номер телефона.": "Enter your Telegram username (@username) or phone number.",
    "Телефон, привязанный к MAX": "Phone number linked to MAX",
    "Укажите номер телефона, например +7 900 000-00-00.": "Enter a phone number, for example +7 900 000-00-00.",
    "Телефон в WhatsApp": "WhatsApp phone number",
    "Телефон для звонка": "Phone number for a call",
    "Рабочая почта": "Work email",
    "Укажите почту, например name@company.ru.": "Enter an email address, for example name@company.com.",
    "Не получилось отправить. Напишите нам на ": "Couldn't send. Email us at ",
    " или в Telegram @archadasupport.": " or message @archadasupport on Telegram.",
    "Готово, спасибо!": "Done, thank you!",
    "name@company.ru": "name@company.com"
    };
  /* ===================== /Английская версия ===================== */
  var AUDIENCE = document.body.getAttribute("data-audience") || "plant"; // plant | vendor
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ===================== Метрика ===================== */
  function goal(name, params) {
    try { if (CONFIG.METRIKA_ID && window.ym) window.ym(CONFIG.METRIKA_ID, "reachGoal", name, params || {}); } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a, button") : null;
    if (!a) return;
    if (a.getAttribute("data-goal")) goal(a.getAttribute("data-goal"));
    if (a.classList.contains("btn-p")) goal("cta_click", { text: (a.textContent || "").trim(), audience: AUDIENCE });
    var interest = a.getAttribute("data-interest");
    if (interest) { var f = $("#lead-form"); if (f && f.interest) f.interest.value = interest; }
    if (a.closest && a.closest("#demo-out .plaque, #demo .plaque")) goal("demo_cta");
  });
  $$(".faq details").forEach(function (d) {
    d.addEventListener("toggle", function () { if (d.open) goal("faq_open", { q: d.querySelector("summary").textContent }); });
  });

  /* ===================== Мобильное меню ===================== */
  $$(".burger .menu a").forEach(function (a) {
    a.addEventListener("click", function () { var b = a.closest(".burger"); if (b) b.open = false; });
  });

  /* ===================== Демо ===================== */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = T(text); return e; }

  var PLANT = {
    press: {
      label: "Ткань в пресс",
      text: "Нужно автоматизировать укладку пропитанной ткани в вырубной пресс и извлечение готовых шайб. Сейчас 1 000 изделий в смену, позже до 2 000. Прессов четыре, рабочий стол хотим сохранить.",
      params: [["Операция","Укладка и извлечение"],["Материал","Пропитанная ткань"],["Объём","1 000–2 000 шт./смену"],["Оборудование","4 вырубных пресса"],["Точность","Рифление по пресс-форме"],["Ограничение","Сохранить стол"]],
      opts: [["SCARA EPSON NS-X6","6 кг, вылет 600 мм, ±0,02 мм, 4 оси",94,"Точность укладки и темп до 2 000 шт. в смену, компактно встаёт в центр стола"],["Дельта-робот, 3 кг","Класс оборудования",71,"Быстрее, но рабочей зоны мало для четырёх прессов"],["Малогабаритный 6-осевой, 7 кг","Класс оборудования",66,"Справится, но лишние оси и выше цена"]],
      vendors: [["Поставщики SCARA-роботов","Есть модели с вылетом 600 мм и точностью ±0,02 мм"],["Интеграторы ячеек для прессов","Референсы по загрузке вырубных и штамповочных прессов"]],
      cost: "3,8–5,9 млн ₽", time: "4–6 мес.", pay: "11–16 мес.",
      note: "Окупаемость при высвобождении 4 операторов и ФОТ 90 тыс. ₽ в месяц на человека."
    },
    pallet: {
      label: "Мешки на паллеты",
      text: "В конце линии вручную укладываем мешки с сухой смесью по 25 кг на паллеты. Около 600 мешков в час, по два человека в смену, работаем в три смены.",
      params: [["Операция","Паллетизация мешков"],["Груз","Мешки по 25 кг"],["Темп","≈ 600 шт./час"],["Режим","3 смены"],["Сейчас","2 оператора в смену"],["Место","Конец линии"]],
      opts: [["Эйдос Робототехника A70-2180","70 кг, вылет 2 180 мм, 6 осей, IP54",91,"Запас по массе с учётом захвата, вылета хватает на две паллеты"],["Завод Роботов RusRobot RR 120-2900","120 кг, вылет 2 900 мм",84,"Больший запас, если позже появятся мешки по 50 кг"],["Колонный паллетайзер","Класс оборудования",69,"Дешевле, но работает медленнее робота"]],
      vendors: [["Поставщики паллетайзеров","Роботы грузоподъёмностью от 50 кг, вилочные захваты для мешков"],["Интеграторы упаковочных линий","Ограждение ячейки, световой барьер, пусконаладка на месте"]],
      cost: "7–10 млн ₽", time: "3–5 мес.", pay: "15–21 мес.",
      note: "Окупаемость при высвобождении 6 операторов и ФОТ 80 тыс. ₽ в месяц на человека."
    },
    cnc: {
      label: "Загрузка станка ЧПУ",
      text: "Токарный станок с ЧПУ, оператор вручную ставит заготовки до 8 кг. Цикл обработки около 4 минут. Хотим, чтобы станок работал и ночью без людей.",
      params: [["Операция","Загрузка станка"],["Заготовка","До 8 кг"],["Цикл","≈ 4 мин"],["Режим","Ночь без оператора"],["Оборудование","Токарный ЧПУ"],["Требование","Рядом с людьми днём"]],
      opts: [["Коллаборативный робот, 10–12 кг","Класс оборудования",88,"Работает рядом с людьми без ограждения, быстро перенастраивается"],["Промышленный 6-осевой, 12–20 кг","Класс оборудования",81,"Быстрее, но нужны ограждение и больше места"],["Портальный загрузчик","Класс оборудования",62,"Хорош для больших серий, сложно встроить в действующий участок"]],
      vendors: [["Поставщики коботов","Коллаборативные роботы 10–12 кг для работы рядом с людьми"],["Интеграторы ячеек для станков","Опыт роботизации загрузки токарных станков с ЧПУ"]],
      cost: "3,5–5 млн ₽", time: "2–4 мес.", pay: "12–18 мес.",
      note: "Окупаемость за счёт ночной смены без оператора: станок работает на треть дольше."
    }
  };

  var VENDOR = {
    press: { label: "Ткань в пресс", src: "Клиент, которого привёл СтрAIтег · описание задачи", text: PLANT.press.text, params: PLANT.press.params,
      opts: [["SCARA, 6 кг, вылет 600 мм","±0,02 мм, 4 оси, вакуумный захват",94,true],["Дельта-робот, 3 кг","Альтернатива другого производителя",71,false]],
      cost: PLANT.press.cost, time: PLANT.press.time, pay: PLANT.press.pay },
    pallet: { label: "Паллетизация мешков", src: "Ваш клиент · письмо на почту отдела продаж", text: PLANT.pallet.text, params: PLANT.pallet.params,
      opts: [["Робот-паллетайзер, 70 кг","Вылет 2 180 мм, 6 осей, IP54",91,true],["Робот 120 кг, вылет 2 900 мм","Альтернатива другого производителя",84,false]],
      cost: PLANT.pallet.cost, time: PLANT.pallet.time, pay: PLANT.pallet.pay },
    cnc: { label: "Загрузка станка ЧПУ", src: "Ваш клиент · запрос с сайта", text: PLANT.cnc.text, params: PLANT.cnc.params,
      opts: [["Коллаборативный робот, 10–12 кг","Без ограждения, двойной захват",88,true],["Промышленный 6-осевой, 12–20 кг","Альтернатива другого производителя",81,false]],
      cost: PLANT.cnc.cost, time: PLANT.cnc.time, pay: PLANT.cnc.pay }
  };

  var DATA = AUDIENCE === "vendor" ? VENDOR : PLANT;
  var KEYS = ["press", "pallet", "cnc"];
  var current = "press";

  function lbl(text, sub) {
    var p = el("p", "lbl", text);
    if (sub) { p.appendChild(document.createTextNode(" ")); p.appendChild(el("span", "sub2", sub)); }
    return p;
  }
  function plaque(title, sub, btn, href) {
    var box = el("div", "plaque"), p = el("p", null, title);
    p.appendChild(el("span", null, sub)); box.appendChild(p);
    var a = el("a", "btn btn-p btn-s", btn); a.href = href || "#lead"; box.appendChild(a);
    return box;
  }
  function params(list) {
    var dl = el("dl", "params");
    list.forEach(function (p) { var d = el("div"); d.appendChild(el("dt", null, p[0])); d.appendChild(el("dd", null, p[1])); dl.appendChild(d); });
    return dl;
  }
  function econ(d, payClass) {
    var box = el("div", "econ");
    [["Под ключ", d.cost, ""], ["Срок внедрения", d.time, ""], ["Окупаемость", d.pay, payClass]].forEach(function (x) {
      var c = el("div", x[2] || null); c.appendChild(el("span", null, x[0])); c.appendChild(el("strong", null, x[1])); box.appendChild(c);
    });
    return box;
  }

  /* ----- Процесс по шагам, как в черновике: каждый шаг «думает», потом показывает результат ----- */
  var REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var STATUS = AUDIENCE === "vendor"
    ? { idle: "Новый запрос", run: "Платформа разбирает запрос", done: "ТКП готово к отправке" }
    : { idle: "Готов к работе", run: "Разбираю задачу", done: "Подбор готов" };
  var MATCH = {
    press: /ткан|пресс|шайб|вырубн|штамп|fabric|press|washer|die.?cut|stamp/i,
    pallet: /паллет|палет|поддон|мешк|короб|упаков|pallet|bag|sack|carton|box|packag/i,
    cnc: /станк|станок|чпу|заготов|токар|фрезер|обработ|cnc|lathe|machin|blank|milling|turning/i
  };
  var token = 0;

  function setStatus(state) {
    var s = $("#demo-status"); if (!s) return;
    s.setAttribute("data-state", state);
    var t = s.querySelector("span"); if (t) t.textContent = T(STATUS[state]);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, REDUCE ? 0 : ms); }); }
  function stagger(root) {
    $$(".params > div, .opts > li, .vend > li, .econ > div, .files > li", root).forEach(function (n, i) { n.style.setProperty("--i", i); });
  }
  function stage(n, title, sub, doing, body) {
    var root = el("div", "stg wait"), h = el("p", "stg-h"), num = el("span", "n", String(n));
    h.appendChild(num); h.appendChild(document.createTextNode(T(title)));
    if (sub) { h.appendChild(document.createTextNode(" ")); h.appendChild(el("span", "sub2", sub)); }
    root.appendChild(h); root.appendChild(el("p", "doing", doing));
    var bd = el("div", "bd"); bd.appendChild(body); root.appendChild(bd);
    return { root: root, num: num };
  }
  function frag(nodes) { var f = el("div"); nodes.forEach(function (n) { if (n) f.appendChild(n); }); return f; }
  function finish(s) {
    s.root.className = "stg ok"; s.num.textContent = "✓";
    $$(".bar span", s.root).forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
  }

  function optList(list, vendor) {
    var ul = el("ul", "opts");
    list.forEach(function (o, i) {
      var best = vendor ? o[3] : i === 0;
      var li = el("li", "opt" + (best ? " best" : ""));
      var b = el("b", null, o[0]); if (vendor && o[3]) b.appendChild(el("span", "tag", "ваш каталог"));
      li.appendChild(b); li.appendChild(el("span", "spec", o[1]));
      var f = el("div", "fit"); f.appendChild(el("strong", null, o[2] + "%")); f.appendChild(el("small", null, "соответствие"));
      var bar = el("div", "bar"), bs = el("span"); bs.style.width = "0"; bs.setAttribute("data-w", o[2]); bar.appendChild(bs); f.appendChild(bar);
      li.appendChild(f);
      if (!vendor) li.appendChild(el("span", "why", o[3]));
      ul.appendChild(li);
    });
    return ul;
  }

  function buildStages(k) {
    if (AUDIENCE === "vendor") {
      var dv = VENDOR[k], files = el("ul", "files");
      [["description", "ТЗ в PDF"], ["request_quote", "ТКП по вашему шаблону"], ["link", "Источники по каждой цифре"]].forEach(function (f) {
        var li = el("li"); li.appendChild(el("span", "ic", f[0])); li.appendChild(document.createTextNode(T(f[1]))); files.appendChild(li);
      });
      return { stages: [
        stage(1, "ТЗ: параметры извлечены автоматически", null, "Разбираю запрос клиента и составляю ТЗ", params(dv.params)),
        stage(2, "Подобрано из вашего каталога", null, "Ищу подходящие позиции в вашем каталоге", optList(dv.opts, true)),
        stage(3, "Обоснование для клиента", null, "Считаю стоимость, сроки и окупаемость", econ(dv, "")),
        stage(4, "Готово к отправке", null, "Собираю ТКП по вашему шаблону", files)
      ], tail: null };
    }
    var d = PLANT[k], vl = el("ul", "vend");
    d.vendors.forEach(function (v) {
      var li = el("li"); li.appendChild(el("span", "ic", "handshake"));
      var s = el("span"); s.appendChild(el("b", null, v[0])); s.appendChild(el("span", "w", v[1])); li.appendChild(s); vl.appendChild(li);
    });
    return { stages: [
      stage(1, "Что мы поняли из описания", null, "Извлекаю операцию, массу, темп и ограничения", params(d.params)),
      stage(2, "3 варианта от разных производителей", null, "Сравниваю каталоги производителей по требованиям", optList(d.opts, false)),
      stage(3, "Кто поставит и внедрит", "· по номенклатуре, референсам и региону", "Ищу вендоров и интеграторов с похожими проектами", vl),
      stage(4, "Стоимость и окупаемость", null, "Считаю бюджет под ключ, сроки и окупаемость", frag([econ(d, "pay"), el("p", "note", T(d.note) + T(" Это пример. По вашей задаче подберём точно."))]))
    ], tail: plaque("Хотите такой же подбор по вашей задаче?", "Оборудование и вендоры за 1 рабочий день, бесплатно", "Подобрать оборудование") };
  }

  function setChips() {
    $$("#chips .chip").forEach(function (b) {
      var on = b.getAttribute("data-k") === current;
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on));
    });
  }

  /* mode: "pending" — шаги видны и ждут; "instant" — сразу результат; "type" — впечатать пример и разобрать; "run" — разобрать текст из поля */
  function run(k, mode, matched) {
    var my = ++token, out = $("#demo-out"), ta = $("#demo-task"), btn = $("#demo-run");
    current = k; setChips();
    var text = T(DATA[k].text), built = buildStages(k);
    out.innerHTML = "";
    if (matched) out.appendChild(el("p", "note match", T("Похожий пример из демо: ") + T(DATA[k].label) + T(". По вашей задаче подберём точно.")));
    built.stages.forEach(function (s) { out.appendChild(s.root); stagger(s.root); });
    function done() {
      if (built.tail) { built.tail.classList.add("demo-tail"); out.appendChild(built.tail); }
      setStatus("done"); if (btn) btn.disabled = false;
    }
    if (mode !== "run" && ta) ta.value = text;
    if (mode === "pending") { setStatus("idle"); return; }
    if (mode === "instant" || REDUCE) { built.stages.forEach(finish); done(); return; }
    setStatus("run"); if (btn) btn.disabled = true;
    (async function () {
      if (mode === "type" && ta) {
        ta.classList.add("typing"); ta.value = "";
        for (var c = 0; c < text.length; c += 3) { if (my !== token) return; ta.value = text.slice(0, c + 3); await wait(14); }
        ta.classList.remove("typing");
      }
      var pause = [950, 1300, 950, 850];
      for (var i = 0; i < built.stages.length; i++) {
        if (my !== token) return;
        built.stages[i].root.className = "stg busy";
        await wait(pause[i]);
        if (my !== token) return;
        finish(built.stages[i]);
        await wait(180);
      }
      if (my === token) done();
    })();
  }

  function miss(text) {
    ++token; current = null; setChips(); setStatus("idle");
    var out = $("#demo-out"), btn = $("#demo-run"); if (btn) btn.disabled = false;
    out.innerHTML = "";
    var box = AUDIENCE === "vendor"
      ? plaque("Этого запроса нет среди примеров демо", "На пилоте платформа разберёт любой запрос ваших клиентов по вашему каталогу.", "Запустить бесплатный пилот")
      : plaque("Этой задачи нет среди примеров демо", "Отправьте её нам: подберём оборудование и вендоров и пришлём результат за 1 рабочий день, бесплатно.", "Отправить мою задачу");
    box.style.marginTop = "0"; out.appendChild(box);
    var formTask = $("#lead-form textarea[name=task]");
    if (formTask && !formTask.value) formTask.value = text;
  }

  function analyze() {
    var ta = $("#demo-task"), text = ta ? ta.value.trim() : "";
    if (!text) { if (ta) { ta.focus(); ta.classList.add("bad"); } return; }
    goal("demo_run", { audience: AUDIENCE });
    for (var i = 0; i < KEYS.length; i++) if (text === DATA[KEYS[i]].text || text === T(DATA[KEYS[i]].text)) { run(KEYS[i], "run", false); return; }
    for (var j = 0; j < KEYS.length; j++) if (MATCH[KEYS[j]].test(text)) { run(KEYS[j], "run", true); return; }
    miss(text);
  }

  function renderDemo() {
    var box = $("#chips"), out = $("#demo-out");
    if (!box || !out) return false;
    box.innerHTML = "";
    KEYS.forEach(function (k) {
      var b = el("button", "chip", DATA[k].label);
      b.type = "button"; b.setAttribute("data-k", k);
      b.addEventListener("click", function () { run(k, "type", false); goal("demo_preset", { preset: k, audience: AUDIENCE }); });
      box.appendChild(b);
    });
    var rb = $("#demo-run"), ta = $("#demo-task");
    if (rb) rb.addEventListener("click", analyze);
    if (ta) ta.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analyze(); });
    if (ta) ta.addEventListener("input", function () { ta.classList.remove("bad"); });
    return true;
  }

  /* Первый показ: пример уже в поле, шаги видны; разбор запускается, когда демо появляется на экране */
  (function () {
    var demo = $("#demo"); if (!demo || !renderDemo()) return;
    if (REDUCE || !("IntersectionObserver" in window)) { run("press", "instant"); return; }
    run("press", "pending");
    var io = new IntersectionObserver(function (en) {
      if (en.some(function (e) { return e.isIntersecting; })) { io.disconnect(); if (current === "press" && token === 1) run("press", "run"); }
    }, { threshold: 0.35 });
    io.observe(demo);
  })();

  /* ===================== Заявки ===================== */
  function utm() {
    var o = {}, q;
    try { q = new URLSearchParams(location.search); } catch (e) { return o; }
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid"].forEach(function (k) { if (q.get(k)) o[k] = q.get(k); });
    try {
      if (Object.keys(o).length) sessionStorage.setItem("st-utm", JSON.stringify(o));
      else o = JSON.parse(sessionStorage.getItem("st-utm") || "{}");
    } catch (e) {}
    return o;
  }
  var UTM = utm();
  var LEAD_ID = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);

  function send(payload) {
    return fetch(CONFIG.FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r; });
  }
  function base(step) {
    return { lead_id: LEAD_ID, step: step, audience: AUDIENCE, lang: LANG, page: location.href, referrer: document.referrer || "", utm: UTM, sent_at: new Date().toISOString() };
  }
  function msg(text, cls) { var m = $("#form-msg"); if (m) { m.className = "msg " + (cls || ""); m.textContent = text; } }

  var f1 = $("#lead-form");

  /* Поле контакта подстраивается под выбранный способ связи */
  var CH = {
    telegram: { l: "Ник или телефон в Telegram", ph: "@username или +7 900 000-00-00", t: "text", im: "text", ac: "username",
                err: "Укажите ник в Telegram (@username) или номер телефона." },
    max:      { l: "Телефон, привязанный к MAX", ph: "+7 900 000-00-00", t: "tel", im: "tel", ac: "tel",
                err: "Укажите номер телефона, например +7 900 000-00-00." },
    whatsapp: { l: "Телефон в WhatsApp", ph: "+7 900 000-00-00", t: "tel", im: "tel", ac: "tel",
                err: "Укажите номер телефона, например +7 900 000-00-00." },
    phone:    { l: "Телефон для звонка", ph: "+7 900 000-00-00", t: "tel", im: "tel", ac: "tel",
                err: "Укажите номер телефона, например +7 900 000-00-00." },
    email:    { l: "Рабочая почта", ph: "name@company.ru", t: "email", im: "email", ac: "email",
                err: "Укажите почту, например name@company.ru." }
  };
  function channel() { var m = f1 && f1.querySelector("input[name=messenger]:checked"); return m && CH[m.value] ? m.value : "telegram"; }
  function contactOk(m, v) {
    var digits = v.replace(/\D/g, "").length;
    if (m === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (m === "telegram") return /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v.replace(/^(https?:\/\/)?t\.me\//, "")) || digits >= 10;
    return digits >= 10;
  }
  function applyChannel() {
    if (!f1 || !f1.contact) return;
    var c = CH[channel()], inp = f1.contact, lab = inp.id ? $("label[for=\"" + inp.id + "\"]") : null;
    if (lab) lab.textContent = T(c.l);
    inp.setAttribute("placeholder", T(c.ph)); inp.setAttribute("inputmode", c.im); inp.setAttribute("autocomplete", c.ac);
    try { inp.type = c.t; } catch (e) {}
    inp.classList.remove("bad"); msg("");
  }
  if (f1) {
    $$("input[name=messenger]", f1).forEach(function (r) { r.addEventListener("change", function () { applyChannel(); if (f1.contact.value) f1.contact.focus(); }); });
    if (f1.contact) f1.contact.addEventListener("input", function () { f1.contact.classList.remove("bad"); });
    applyChannel();
  }

  if (f1) f1.addEventListener("submit", function (e) {
    e.preventDefault();
    if (f1.website && f1.website.value) return; // антиспам
    var contact = (f1.contact.value || "").trim();
    var task = f1.task ? f1.task.value.trim() : "";
    var company = f1.company ? f1.company.value.trim() : "";
    if (!contactOk(channel(), contact)) {
      msg(T(CH[channel()].err), "err"); f1.contact.classList.add("bad"); f1.contact.focus(); return;
    }
    var mess = f1.querySelector("input[name=messenger]:checked");
    var p = base(1);
    p.contact = contact; p.messenger = mess ? mess.value : ""; p.task = task; p.company = company;
    p.interest = f1.interest ? f1.interest.value : ""; p.consent = true;
    var btn = f1.querySelector("button[type=submit]"); btn.disabled = true; msg("");
    send(p).then(function () {
      goal("form_step1", { audience: AUDIENCE });
      $("#step1").hidden = true; $("#step2").hidden = false;
    }).catch(function () {
      msg(T("Не получилось отправить. Напишите нам на ") + CONFIG.FALLBACK_EMAIL + T(" или в Telegram @archadasupport."), "err");
    }).then(function () { btn.disabled = false; });
  });

  var f2 = $("#lead-form-2");
  if (f2) f2.addEventListener("submit", function (e) {
    e.preventDefault();
    var p = base(2);
    $$("input, textarea", f2).forEach(function (i) {
      if (i.type === "radio") { if (i.checked) p[i.name] = i.value; }
      else if (i.name) p[i.name] = i.value.trim();
    });
    var btn = f2.querySelector("button[type=submit]"); btn.disabled = true;
    send(p).then(function () {
      goal("form_step2", { audience: AUDIENCE });
      btn.textContent = T("Готово, спасибо!");
    }).catch(function () { btn.disabled = false; });
  });
})();
