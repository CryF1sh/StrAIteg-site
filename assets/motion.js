/* СтрAIтег — анимации прокрутки (ветка animations).
   1. Линия процесса справа вместо полосы прокрутки: узлы — разделы страницы, ползунок можно тянуть.
   2. Инженерный чертёж на фоне: робот SCARA переносит детали в такт прокрутке.
   Отключить на странице: <body data-motion="off">. Только линию или только чертёж: data-motion="rail" / "blueprint". */
(function () {
  "use strict";
  var mode = document.body.getAttribute("data-motion") || "all";
  if (mode === "off") return;
  var EN = (document.documentElement.lang || "ru").slice(0, 2) === "en";
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var root = document.documentElement;
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function maxScroll() { return Math.max(1, root.scrollHeight - window.innerHeight); }

  /* ====================== 1. Линия процесса справа ====================== */
  function initRail() {
    var rail = document.createElement("nav");
    rail.className = "rail"; rail.setAttribute("aria-label", EN ? "Page sections" : "Разделы страницы");
    rail.innerHTML = '<div class="rail-track"><div class="rail-fill"></div></div><div class="rail-head" role="slider" tabindex="0" aria-label="' +
      (EN ? "Page position" : "Положение на странице") + '" aria-valuemin="0" aria-valuemax="100"><span class="rail-tip"></span></div>';
    document.body.appendChild(rail);
    var track = rail.querySelector(".rail-track"), fill = rail.querySelector(".rail-fill"), head = rail.querySelector(".rail-head"), tip = head.querySelector(".rail-tip");
    var secs = $$("main section").filter(function (s) { return s.offsetHeight > 120; });
    var nodes = secs.map(function (s, i) {
      var eb = s.querySelector(".eyebrow"), h = s.querySelector("h1, h2");
      var label = i === 0 ? (EN ? "Start" : "Начало") : (eb ? eb.textContent : h ? h.textContent : s.getAttribute("aria-label") || "");
      label = label.replace(/\s+/g, " ").trim(); if (label.length > 34) label = label.slice(0, 32) + "…";
      var b = document.createElement("button");
      b.type = "button"; b.className = "rail-node"; b.setAttribute("aria-label", label);
      b.innerHTML = '<i></i><span>' + label.replace(/</g, "&lt;") + "</span>";
      b.addEventListener("click", function () { window.scrollTo({ top: Math.max(0, s.getBoundingClientRect().top + window.scrollY - 72), behavior: REDUCE ? "auto" : "smooth" }); });
      rail.appendChild(b);
      return { el: b, sec: s, label: label, at: 0 };
    });
    var H = 0, top0 = 0, idle = 0;
    function layout() {
      var r = track.getBoundingClientRect(); H = r.height; top0 = r.top;
      var m = maxScroll();
      nodes.forEach(function (n) {
        n.at = clamp((n.sec.getBoundingClientRect().top + window.scrollY - 72) / m, 0, 1);
        n.el.style.top = (track.offsetTop + n.at * H) + "px";
      });
      update();
    }
    function update() {
      var p = clamp(window.scrollY / maxScroll(), 0, 1);
      fill.style.height = (p * H) + "px";
      head.style.top = (track.offsetTop + p * H) + "px";
      head.setAttribute("aria-valuenow", String(Math.round(p * 100)));
      var cur = 0;
      nodes.forEach(function (n, i) { var on = n.at <= p + 0.002; n.el.classList.toggle("on", on); if (on) cur = i; });
      nodes.forEach(function (n, i) { n.el.classList.toggle("cur", i === cur); });
      tip.textContent = nodes[cur] ? nodes[cur].label : "";
      rail.classList.add("moving"); clearTimeout(idle); idle = setTimeout(function () { rail.classList.remove("moving"); }, 1100);
    }
    function seek(clientY) {
      var f = clamp((clientY - top0) / H, 0, 1);
      window.scrollTo({ top: f * maxScroll(), behavior: "instant" });
    }
    var drag = false;
    function down(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest(".rail-node")) return;
      drag = true; rail.classList.add("drag"); layout(); seek(e.clientY);
      if (rail.setPointerCapture && e.pointerId != null) try { rail.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault();
    }
    rail.addEventListener("pointerdown", down);
    rail.addEventListener("pointermove", function (e) { if (drag) seek(e.clientY); });
    function up() { drag = false; rail.classList.remove("drag"); }
    rail.addEventListener("pointerup", up); rail.addEventListener("pointercancel", up);
    head.addEventListener("keydown", function (e) {
      var k = e.key, step = window.innerHeight * 0.8;
      if (k === "ArrowDown" || k === "PageDown") { window.scrollBy(0, step); e.preventDefault(); }
      if (k === "ArrowUp" || k === "PageUp") { window.scrollBy(0, -step); e.preventDefault(); }
      if (k === "Home") { window.scrollTo(0, 0); e.preventDefault(); }
      if (k === "End") { window.scrollTo(0, maxScroll()); e.preventDefault(); }
    });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", layout);
    window.addEventListener("load", layout);
    if (window.ResizeObserver) new ResizeObserver(layout).observe(document.body);
    root.classList.add("has-rail");
    layout();
  }

  /* ====================== 2. Инженерный чертёж на фоне ====================== */
  function initBlueprint() {
    var cv = document.createElement("canvas");
    cv.className = "bp"; cv.setAttribute("aria-hidden", "true");
    document.body.insertBefore(cv, document.body.firstChild);
    root.classList.add("has-bp");
    var ctx = cv.getContext("2d"), W = 0, H = 0, DPR = 1, p = 0, s = 0, raf = 0, last = 0;
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      kick();
    }
    function ease(x) { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); } /* плавный старт и остановка */
    function lerp(a, b, t) { return a + (b - a) * t; }
    function mono(px, w) { ctx.font = (w || 400) + " " + px + "px Montserrat, system-ui, sans-serif"; }
    function label(t, x, y, c) { mono(10, 600); ctx.fillStyle = c || "rgba(229,233,236,.8)"; ctx.fillText(t, x, y); }

    /* Траектория захвата за один цикл: опуститься к заготовке → перенести к прессу → подняться → вернуться пустым */
    function tipAt(f, A, Bk, h0, lift) {
      var Au = { x: A.x, y: A.y - h0 }, Bu = { x: Bk.x, y: Bk.y - h0 }, u;
      if (f < 0.12) { u = ease(f / 0.12); return { x: Au.x, y: lerp(Au.y, A.y, u), carry: false }; }
      if (f < 0.52) { u = ease((f - 0.12) / 0.40); return { x: lerp(A.x, Bk.x, u), y: lerp(A.y, Bk.y, u) - lift * Math.sin(Math.PI * u), carry: true }; }
      if (f < 0.62) { u = ease((f - 0.52) / 0.10); return { x: Bk.x, y: lerp(Bk.y, Bu.y, u), carry: false }; }
      u = ease((f - 0.62) / 0.38); return { x: lerp(Bu.x, Au.x, u), y: lerp(Bu.y, Au.y, u) - lift * 0.45 * Math.sin(Math.PI * u), carry: false };
    }
    function link(a, b, w) {
      var ang = Math.atan2(b.y - a.y, b.x - a.x), len = Math.hypot(b.x - a.x, b.y - a.y);
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0, -w); ctx.lineTo(len, -w * .7); ctx.arc(len, 0, w * .7, -Math.PI / 2, Math.PI / 2); ctx.lineTo(0, w); ctx.arc(0, 0, w, Math.PI / 2, -Math.PI / 2); ctx.closePath();
      ctx.fillStyle = "rgba(29,30,46,.92)"; ctx.fill(); ctx.stroke();
      ctx.setLineDash([3, 4]); ctx.strokeStyle = "rgba(152,162,179,.45)"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var sc = clamp(H / 900, 0.7, 1.05), bx = W - 110 * sc - 44, by = H - 70 * sc;
      var L1 = 175 * sc, L2 = 150 * sc, L3 = 44 * sc, ph = 10 * sc, pw = 26 * sc;
      var sh = { x: bx, y: by - 44 * sc };
      /* конвейер и пресс по одну сторону от основания: рука всегда «локтем вверх», без переворота */
      var A = { x: bx - 290 * sc, y: by - 26 * sc - ph }, B0 = { x: bx - 140 * sc, y: by - 58 * sc - ph };
      var CYC = 4, cyc = p * CYC, k = Math.min(CYC - 1, Math.floor(cyc)), f = p >= 1 ? 1 : cyc - k;
      var Bk = { x: B0.x, y: B0.y - k * ph };
      var t = tipAt(f, A, Bk, 34 * sc, 120 * sc);
      /* обратная кинематика двухзвенного плеча (запястье над захватом) */
      var wx = t.x, wy = t.y - L3, dx = wx - sh.x, dy = wy - sh.y, d = Math.min(L1 + L2 - 0.5, Math.hypot(dx, dy));
      var q2 = Math.acos(clamp((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1));
      var q1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(-q2), L1 + L2 * Math.cos(-q2));
      var el = { x: sh.x + L1 * Math.cos(q1), y: sh.y + L1 * Math.sin(q1) }, wr = { x: el.x + L2 * Math.cos(q1 - q2), y: el.y + L2 * Math.sin(q1 - q2) };
      var tip = { x: wr.x, y: wr.y + L3 };

      /* сетка чертежа только вокруг робота и с плавным затуханием, чтобы не шуметь по всей странице */
      var gcx = bx - 170 * sc, gcy = by - 150 * sc, gr = 470 * sc, step = 24 * sc, oy = -((s * 0.12) % step);
      ctx.save(); ctx.lineWidth = 1;
      for (var gx = Math.floor((gcx - gr) / step) * step; gx < gcx + gr; gx += step) { ctx.strokeStyle = Math.round(gx / step) % 4 === 0 ? "rgba(152,162,179,.10)" : "rgba(152,162,179,.045)"; ctx.beginPath(); ctx.moveTo(gx + .5, gcy - gr); ctx.lineTo(gx + .5, gcy + gr); ctx.stroke(); }
      for (var gy = Math.floor((gcy - gr) / step) * step + oy; gy < gcy + gr; gy += step) { ctx.strokeStyle = Math.round((gy - oy) / step) % 4 === 0 ? "rgba(152,162,179,.10)" : "rgba(152,162,179,.045)"; ctx.beginPath(); ctx.moveTo(gcx - gr, gy + .5); ctx.lineTo(gcx + gr, gy + .5); ctx.stroke(); }
      var fade = ctx.createRadialGradient(gcx, gcy, gr * 0.15, gcx, gcy, gr);
      fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "destination-in"; ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H);
      ctx.restore();

      var BA = W < 1100 ? 0.3 : 0.5; ctx.globalAlpha = BA;
      /* стол, конвейер заготовок, пресс */
      ctx.strokeStyle = "rgba(152,162,179,.7)";
      ctx.beginPath(); ctx.moveTo(bx - 370 * sc, by + .5); ctx.lineTo(bx + 70 * sc, by + .5); ctx.stroke();
      ctx.strokeRect(A.x - 60 * sc, A.y + ph, 120 * sc, 12 * sc);
      for (var r = 0; r < 4; r++) { ctx.beginPath(); ctx.arc(A.x - 45 * sc + r * 30 * sc, A.y + ph + 6 * sc, 3.5 * sc, 0, 6.283); ctx.stroke(); }
      ctx.strokeRect(B0.x - 38 * sc, B0.y + ph, 76 * sc, by - B0.y - ph);
      ctx.strokeRect(B0.x - 30 * sc, B0.y - 70 * sc, 60 * sc, 18 * sc);
      label(EN ? "BLANKS" : "ЗАГОТОВКИ", A.x - 60 * sc, by + 18 * sc, "rgba(152,162,179,.8)");
      label(EN ? "PRESS" : "ПРЕСС", B0.x - 38 * sc, by + 18 * sc, "rgba(152,162,179,.8)");
      /* основание и звенья */
      ctx.strokeStyle = "rgba(229,233,236,.9)"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(bx - 38 * sc, by); ctx.lineTo(bx - 24 * sc, sh.y + 10 * sc); ctx.lineTo(bx + 24 * sc, sh.y + 10 * sc); ctx.lineTo(bx + 38 * sc, by); ctx.closePath();
      ctx.fillStyle = "rgba(29,30,46,.92)"; ctx.fill(); ctx.stroke();
      link(sh, el, 15 * sc); link(el, wr, 11 * sc);
      ctx.beginPath(); ctx.moveTo(wr.x, wr.y); ctx.lineTo(tip.x, tip.y - 8 * sc); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tip.x - 13 * sc, tip.y - 8 * sc); ctx.lineTo(tip.x + 13 * sc, tip.y - 8 * sc); ctx.moveTo(tip.x - 13 * sc, tip.y - 8 * sc); ctx.lineTo(tip.x - 13 * sc, tip.y); ctx.moveTo(tip.x + 13 * sc, tip.y - 8 * sc); ctx.lineTo(tip.x + 13 * sc, tip.y); ctx.stroke();
      /* детали: стопка в прессе, заготовка на конвейере, деталь в захвате — без скачков */
      ctx.fillStyle = "#FF8500";
      var placed = k + (f >= 0.52 ? 1 : 0);
      for (var n = 0; n < placed; n++) ctx.fillRect(B0.x - pw / 2, B0.y - n * ph + 1, pw, ph - 2);
      if (t.carry) ctx.fillRect(tip.x - pw / 2, tip.y + 1, pw, ph - 2);
      else if (f < 0.12) ctx.fillRect(A.x - pw / 2, A.y + 1, pw, ph - 2);
      else if (f >= 0.62 && k < CYC - 1) { var slide = ease((f - 0.62) / 0.38); ctx.globalAlpha *= slide; ctx.fillRect(A.x - pw / 2 - (1 - slide) * 50 * sc, A.y + 1, pw, ph - 2); ctx.globalAlpha = BA; }
      /* суставы */
      [sh, el, wr].forEach(function (j) { ctx.beginPath(); ctx.arc(j.x, j.y, 5 * sc + 2, 0, 6.283); ctx.fillStyle = "#1D1E2E"; ctx.fill(); ctx.strokeStyle = "#FF8500"; ctx.lineWidth = 2; ctx.stroke(); });
      ctx.lineWidth = 1;
      /* размеры и подписи */
      var d1 = Math.round(-q1 * 180 / Math.PI), d2 = Math.round(q2 * 180 / Math.PI);
      ctx.strokeStyle = "rgba(255,133,0,.65)"; ctx.beginPath(); ctx.arc(sh.x, sh.y, 30 * sc, Math.min(0, q1), Math.max(0, q1)); ctx.stroke();
      label("θ1 " + d1 + "°", sh.x + 14 * sc, sh.y + 30 * sc, "rgba(255,133,0,.8)");
      label("θ2 " + d2 + "°", el.x + 14, el.y - 12, "rgba(255,133,0,.8)");
      label("SCARA · 6 " + (EN ? "kg" : "кг") + " · ±0,02 " + (EN ? "mm" : "мм") + " · " + (EN ? "parts " : "деталей ") + placed + "/" + CYC, bx - 370 * sc, by + 38 * sc, "rgba(152,162,179,.85)");
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      var target = clamp(window.scrollY / maxScroll(), 0, 1), targetS = window.scrollY;
      var k = REDUCE ? 1 : 1 - Math.exp(-dt * 4.5); /* мягкое сглаживание без рывков, не зависит от частоты кадров */
      p += (target - p) * k; s += (targetS - s) * k;
      draw();
      if (Math.abs(target - p) > 0.00005 || Math.abs(targetS - s) > 0.3) raf = requestAnimationFrame(frame);
      else last = 0;
    }
    function kick() { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); }
    p = clamp(window.scrollY / maxScroll(), 0, 1); s = window.scrollY;
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", kick);
    resize();
  }

  var wide = window.matchMedia("(min-width: 1101px)").matches;
  if ((mode === "all" || mode === "rail") && wide) initRail();
  if ((mode === "all" || mode === "blueprint") && window.matchMedia("(min-width: 760px)").matches) initBlueprint();
})();
