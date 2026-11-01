/* СтрAIтег — скрипт лендингов (производства и вендоры).
   Настройки — в блоке CONFIG ниже. Подробности — README.md. */
(function () {
  "use strict";

  /* ===================== CONFIG ===================== */
  var CONFIG = {
    // Куда отправлять заявки (POST, JSON). Готовый обработчик: /api/lead.php
    // Можно указать webhook amoCRM / Bitrix24 / n8n напрямую.
    FORM_ENDPOINT: "/api/lead.php",
    // Номер счётчика Яндекс.Метрики задаётся в <head> каждой страницы: window.YM_ID
    METRIKA_ID: window.YM_ID || 0,
    // Запасной адрес, если отправка не удалась
    FALLBACK_EMAIL: "info@straitegist.ru"
  };

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
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

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
    press: { label: "Ткань в пресс", text: PLANT.press.text, params: PLANT.press.params,
      opts: [["SCARA, 6 кг, вылет 600 мм","±0,02 мм, 4 оси, вакуумный захват",94,true],["Дельта-робот, 3 кг","Альтернатива другого производителя",71,false]],
      cost: PLANT.press.cost, time: PLANT.press.time, pay: PLANT.press.pay },
    pallet: { label: "Паллетизация мешков", text: PLANT.pallet.text, params: PLANT.pallet.params,
      opts: [["Робот-паллетайзер, 70 кг","Вылет 2 180 мм, 6 осей, IP54",91,true],["Робот 120 кг, вылет 2 900 мм","Альтернатива другого производителя",84,false]],
      cost: PLANT.pallet.cost, time: PLANT.pallet.time, pay: PLANT.pallet.pay },
    cnc: { label: "Загрузка станка ЧПУ", text: PLANT.cnc.text, params: PLANT.cnc.params,
      opts: [["Коллаборативный робот, 10–12 кг","Без ограждения, двойной захват",88,true],["Промышленный 6-осевой, 12–20 кг","Альтернатива другого производителя",81,false]],
      cost: PLANT.cnc.cost, time: PLANT.cnc.time, pay: PLANT.cnc.pay }
  };

  var DATA = AUDIENCE === "vendor" ? VENDOR : PLANT;
  var KEYS = AUDIENCE === "vendor" ? ["press", "pallet", "cnc"] : ["press", "pallet", "cnc", "other"];
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

  function renderPlant(out, k) {
    if (k === "other") {
      out.appendChild(plaque("Вашей задачи нет среди примеров?",
        "Это нормально: пример лишь показывает формат. Отправьте свою задачу: подберём оборудование и вендоров вручную и пришлём результат за 1 рабочий день.",
        "Отправить мою задачу"));
      out.firstChild.style.marginTop = "0";
      return;
    }
    var d = PLANT[k];
    var q = el("p", "quote-task"); q.appendChild(el("small", null, "Задача словами производства")); q.appendChild(document.createTextNode(d.text)); out.appendChild(q);
    out.appendChild(lbl("Что мы поняли из описания")); out.appendChild(params(d.params));
    out.appendChild(lbl("3 варианта от разных производителей"));
    var ul = el("ul", "opts");
    d.opts.forEach(function (o, i) {
      var li = el("li", "opt" + (i === 0 ? " best" : ""));
      li.appendChild(el("b", null, o[0])); li.appendChild(el("span", "spec", o[1]));
      var f = el("div", "fit"); f.appendChild(el("strong", null, o[2] + "%")); f.appendChild(el("small", null, "соответствие"));
      var bar = el("div", "bar"), bs = el("span"); bs.style.width = o[2] + "%"; bar.appendChild(bs); f.appendChild(bar);
      li.appendChild(f); li.appendChild(el("span", "why", o[3])); ul.appendChild(li);
    });
    out.appendChild(ul);
    out.appendChild(lbl("Кто поставит и внедрит", "· по номенклатуре, референсам и региону"));
    var vl = el("ul", "vend");
    d.vendors.forEach(function (v) {
      var li = el("li"); li.appendChild(el("span", "ic", "handshake"));
      var s = el("span"); s.appendChild(el("b", null, v[0])); s.appendChild(el("span", "w", v[1])); li.appendChild(s); vl.appendChild(li);
    });
    out.appendChild(vl);
    out.appendChild(lbl("Дополнительно: стоимость и окупаемость")); out.appendChild(econ(d, "pay"));
    out.appendChild(el("p", "note", d.note + " Это пример. По вашей задаче подберём точно."));
    out.appendChild(plaque("Хотите такой же подбор по вашей задаче?", "Оборудование и вендоры за 1 рабочий день, бесплатно", "Подобрать оборудование"));
  }

  function renderVendor(out, k) {
    var d = VENDOR[k];
    var q = el("p", "quote-task"); q.appendChild(el("small", null, "Как производство описало задачу")); q.appendChild(document.createTextNode(d.text)); out.appendChild(q);
    out.appendChild(lbl("Параметры, извлечённые из описания")); out.appendChild(params(d.params));
    out.appendChild(lbl("Подобранные позиции"));
    var ul = el("ul", "opts");
    d.opts.forEach(function (o) {
      var li = el("li", "opt" + (o[3] ? " best" : ""));
      var b = el("b", null, o[0]); if (o[3]) b.appendChild(el("span", "tag", "ваш каталог"));
      li.appendChild(b); li.appendChild(el("span", "spec", o[1]));
      var f = el("div", "fit"); f.appendChild(el("strong", null, o[2] + "%")); f.appendChild(el("small", null, "соответствие")); li.appendChild(f);
      ul.appendChild(li);
    });
    out.appendChild(ul);
    out.appendChild(lbl("Расчёт, который уже видел заказчик")); out.appendChild(econ(d, ""));
  }

  function renderDemo() {
    var box = $("#chips"), out = $("#demo-out");
    if (!box || !out) return;
    box.innerHTML = "";
    KEYS.forEach(function (k) {
      var b = el("button", "chip" + (k === current ? " on" : ""), k === "other" ? "Моя задача другая" : DATA[k].label);
      b.type = "button"; b.setAttribute("aria-pressed", String(k === current));
      b.addEventListener("click", function () { current = k; renderDemo(); goal("demo_preset", { preset: k, audience: AUDIENCE }); });
      box.appendChild(b);
    });
    out.innerHTML = "";
    if (AUDIENCE === "vendor") renderVendor(out, current); else renderPlant(out, current);
  }
  renderDemo();

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
    return { lead_id: LEAD_ID, step: step, audience: AUDIENCE, page: location.href, referrer: document.referrer || "", utm: UTM, sent_at: new Date().toISOString() };
  }
  function msg(text, cls) { var m = $("#form-msg"); if (m) { m.className = "msg " + (cls || ""); m.textContent = text; } }

  var f1 = $("#lead-form");
  if (f1) f1.addEventListener("submit", function (e) {
    e.preventDefault();
    if (f1.website && f1.website.value) return; // антиспам
    var contact = (f1.contact.value || "").trim();
    var task = f1.task ? f1.task.value.trim() : "";
    var company = f1.company ? f1.company.value.trim() : "";
    if (!contact || contact.replace(/\D/g, "").length < 5 && contact.indexOf("@") < 0) {
      msg("Укажите телефон или ник в мессенджере, чтобы мы смогли ответить.", "err"); f1.contact.focus(); return;
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
      msg("Не получилось отправить. Напишите нам на " + CONFIG.FALLBACK_EMAIL + " или в Telegram.", "err");
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
      btn.textContent = "Готово, спасибо!";
    }).catch(function () { btn.disabled = false; });
  });
})();
