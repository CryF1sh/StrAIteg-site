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

  /* ----- Процесс по шагам: каждый шаг «думает», потом показывает результат ----- */
  var REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var STATUS = AUDIENCE === "vendor"
    ? { idle: "Новый запрос", run: "Платформа разбирает запрос", done: "ТКП готово к отправке" }
    : { idle: "Готов к работе", run: "Разбираю задачу", done: "Подбор готов" };
  var token = 0;

  function setStatus(state) {
    var s = $("#demo-status"); if (!s) return;
    s.setAttribute("data-state", state);
    var t = s.querySelector("span"); if (t) t.textContent = STATUS[state];
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, REDUCE ? 0 : ms); }); }
  function stagger(root) {
    $$(".params > div, .opts > li, .vend > li, .econ > div, .files > li", root).forEach(function (n, i) { n.style.setProperty("--i", i); });
  }
  function stage(n, title, sub, doing, body) {
    var root = el("div", "stg wait"), h = el("p", "stg-h"), num = el("span", "n", String(n));
    h.appendChild(num); h.appendChild(document.createTextNode(title));
    if (sub) { h.appendChild(document.createTextNode(" ")); h.appendChild(el("span", "sub2", sub)); }
    root.appendChild(h); root.appendChild(el("p", "doing", doing));
    var bd = el("div", "bd"); bd.appendChild(body); root.appendChild(bd);
    return { root: root, num: num, n: n };
  }
  function quote(src, text) {
    var q = el("p", "quote-task"); q.appendChild(el("small", null, src));
    var tx = el("span", "qt-tx", text); q.appendChild(tx);
    return { root: q, tx: tx, text: text };
  }
  function frag(nodes) { var f = el("div"); nodes.forEach(function (n) { if (n) f.appendChild(n); }); return f; }

  function play(out, q, stages, tail, animate) {
    var my = ++token;
    out.innerHTML = "";
    out.appendChild(q.root);
    stages.forEach(function (s) { out.appendChild(s.root); stagger(s.root); });
    function finish(s) {
      s.root.className = "stg ok"; s.num.textContent = "✓";
      $$(".bar span", s.root).forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
    }
    function showTail() { if (tail) { tail.classList.add("demo-tail"); out.appendChild(tail); } }
    if (animate === "pending") { setStatus("idle"); return; }
    if (!animate || REDUCE) {
      stages.forEach(finish); showTail(); setStatus("done"); return;
    }
    setStatus("run");
    (async function () {
      q.root.classList.add("typing"); q.tx.textContent = "";
      for (var c = 0; c < q.text.length; c += 3) {
        if (my !== token) return;
        q.tx.textContent = q.text.slice(0, c + 3);
        await wait(14);
      }
      q.root.classList.remove("typing");
      var pause = [950, 1300, 950, 850];
      for (var i = 0; i < stages.length; i++) {
        if (my !== token) return;
        stages[i].root.className = "stg busy";
        await wait(pause[i] || 900);
        if (my !== token) return;
        finish(stages[i]);
        await wait(180);
      }
      if (my !== token) return;
      showTail(); setStatus("done");
    })();
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

  function renderPlant(out, k, animate) {
    if (k === "other") {
      ++token; out.innerHTML = ""; setStatus("idle");
      out.appendChild(plaque("Вашей задачи нет среди примеров?",
        "Это нормально: пример лишь показывает формат. Отправьте свою задачу: подберём оборудование и вендоров вручную и пришлём результат за 1 рабочий день.",
        "Отправить мою задачу"));
      out.firstChild.style.marginTop = "0";
      return;
    }
    var d = PLANT[k];
    var vl = el("ul", "vend");
    d.vendors.forEach(function (v) {
      var li = el("li"); li.appendChild(el("span", "ic", "handshake"));
      var s = el("span"); s.appendChild(el("b", null, v[0])); s.appendChild(el("span", "w", v[1])); li.appendChild(s); vl.appendChild(li);
    });
    var stages = [
      stage(1, "Что мы поняли из описания", null, "Извлекаю операцию, массу, темп и ограничения", params(d.params)),
      stage(2, "3 варианта от разных производителей", null, "Сравниваю каталоги производителей по требованиям", optList(d.opts, false)),
      stage(3, "Кто поставит и внедрит", "· по номенклатуре, референсам и региону", "Ищу вендоров и интеграторов с похожими проектами", vl),
      stage(4, "Стоимость и окупаемость", null, "Считаю бюджет под ключ, сроки и окупаемость", frag([econ(d, "pay"), el("p", "note", d.note + " Это пример. По вашей задаче подберём точно.")]))
    ];
    play(out, quote("Задача словами производства", d.text), stages,
      plaque("Хотите такой же подбор по вашей задаче?", "Оборудование и вендоры за 1 рабочий день, бесплатно", "Подобрать оборудование"), animate);
  }

  function renderVendor(out, k, animate) {
    var d = VENDOR[k];
    var files = el("ul", "files");
    [["description", "ТЗ в PDF"], ["request_quote", "ТКП по вашему шаблону"], ["link", "Источники по каждой цифре"]].forEach(function (f) {
      var li = el("li"); li.appendChild(el("span", "ic", f[0])); li.appendChild(document.createTextNode(f[1])); files.appendChild(li);
    });
    var stages = [
      stage(1, "ТЗ: параметры извлечены автоматически", null, "Разбираю запрос клиента и составляю ТЗ", params(d.params)),
      stage(2, "Подобрано из вашего каталога", null, "Ищу подходящие позиции в вашем каталоге", optList(d.opts, true)),
      stage(3, "Обоснование для клиента", null, "Считаю стоимость, сроки и окупаемость", econ(d, "")),
      stage(4, "Готово к отправке", null, "Собираю ТКП по вашему шаблону", files)
    ];
    play(out, quote(d.src, d.text), stages, null, animate);
  }

  function renderDemo(animate) {
    var box = $("#chips"), out = $("#demo-out");
    if (!box || !out) return;
    box.innerHTML = "";
    KEYS.forEach(function (k) {
      var b = el("button", "chip" + (k === current ? " on" : ""), k === "other" ? "Моя задача другая" : DATA[k].label);
      b.type = "button"; b.setAttribute("aria-pressed", String(k === current));
      b.addEventListener("click", function () { current = k; renderDemo(true); goal("demo_preset", { preset: k, audience: AUDIENCE }); });
      box.appendChild(b);
    });
    if (AUDIENCE === "vendor") renderVendor(out, current, animate); else renderPlant(out, current, animate);
  }

  /* Первый показ: шаги видны, а «разбор» запускается, когда демо появляется на экране */
  (function () {
    var demo = $("#demo"); if (!demo) return;
    if (REDUCE || !("IntersectionObserver" in window)) { renderDemo(false); return; }
    renderDemo("pending");
    var io = new IntersectionObserver(function (en) {
      if (en.some(function (e) { return e.isIntersecting; })) { io.disconnect(); renderDemo(true); }
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
    return { lead_id: LEAD_ID, step: step, audience: AUDIENCE, page: location.href, referrer: document.referrer || "", utm: UTM, sent_at: new Date().toISOString() };
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
    if (lab) lab.textContent = c.l;
    inp.setAttribute("placeholder", c.ph); inp.setAttribute("inputmode", c.im); inp.setAttribute("autocomplete", c.ac);
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
      msg(CH[channel()].err, "err"); f1.contact.classList.add("bad"); f1.contact.focus(); return;
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
      msg("Не получилось отправить. Напишите нам на " + CONFIG.FALLBACK_EMAIL + " или в Telegram @archadasupport.", "err");
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
