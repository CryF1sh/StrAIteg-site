<?php
/**
 * СтрAIтег — приём заявок с лендингов.
 * Принимает JSON от assets/site.js, отправляет заявку в Telegram и (по желанию)
 * пересылает в CRM по webhook (amoCRM, Bitrix24, n8n и т.п.).
 * Требования: PHP 7.4+, расширение curl.
 */

/* ===== НАСТРОЙКИ (лучше задать через переменные окружения) ===== */
$TG_TOKEN    = getenv('TG_BOT_TOKEN') ?: '';      // токен бота от @BotFather
$TG_CHAT_ID  = getenv('TG_CHAT_ID') ?: '';        // id чата/группы для заявок
$CRM_WEBHOOK = getenv('CRM_WEBHOOK_URL') ?: '';   // URL входящего webhook CRM (необязательно)
$ALLOWED_ORIGIN = 'https://straitegist.ru';
$LOG_FILE    = __DIR__ . '/leads.log';            // закройте доступ к файлу извне (см. .htaccess)

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }

$raw = file_get_contents('php://input');
if (strlen($raw) > 20000) { http_response_code(413); echo '{"ok":false}'; exit; }
$d = json_decode($raw, true);
if (!is_array($d)) { http_response_code(400); echo '{"ok":false,"error":"bad json"}'; exit; }

function s($v, $max = 2000) { return mb_substr(trim(strip_tags((string)$v)), 0, $max); }

$step     = (int)($d['step'] ?? 1);
$audience = ($d['audience'] ?? '') === 'vendor' ? 'vendor' : 'plant';
$leadId   = s($d['lead_id'] ?? '', 64);
if ($step === 1 && s($d['contact'] ?? '') === '') { http_response_code(422); echo '{"ok":false,"error":"contact"}'; exit; }

$labels = [
  'contact' => 'Контакт', 'messenger' => 'Мессенджер', 'task' => 'Задача', 'company' => 'Компания',
  'interest' => 'Интерес', 'name' => 'Имя', 'region' => 'Регион', 'role' => 'Роль',
  'position' => 'Должность', 'catalog' => 'Каталог',
];
$lines = [];
$lines[] = ($audience === 'vendor' ? 'ВЕНДОР / ИНТЕГРАТОР' : 'ПРОИЗВОДСТВО') . ($step === 2 ? ' · дополнение' : ' · новая заявка');
foreach ($labels as $k => $t) { if (!empty($d[$k])) $lines[] = $t . ': ' . s($d[$k]); }
if (!empty($d['utm']) && is_array($d['utm'])) {
  $u = [];
  foreach ($d['utm'] as $k => $v) $u[] = s($k, 30) . '=' . s($v, 100);
  $lines[] = 'UTM: ' . implode(', ', $u);
}
$lines[] = 'Страница: ' . s($d['page'] ?? '', 300);
$lines[] = 'ID: ' . $leadId;
$text = implode("\n", $lines);

$ok = true;

if ($TG_TOKEN && $TG_CHAT_ID) {
  $ch = curl_init("https://api.telegram.org/bot{$TG_TOKEN}/sendMessage");
  curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
    CURLOPT_POSTFIELDS => ['chat_id' => $TG_CHAT_ID, 'text' => $text, 'disable_web_page_preview' => 'true'],
  ]);
  $res = curl_exec($ch);
  $ok = $ok && $res !== false && curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200;
  curl_close($ch);
}

if ($CRM_WEBHOOK) {
  $ch = curl_init($CRM_WEBHOOK);
  curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($d, JSON_UNESCAPED_UNICODE),
  ]);
  curl_exec($ch);
  curl_close($ch);
}

@file_put_contents($LOG_FILE, date('c') . ' ' . json_encode($d, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);

if (!$ok) { http_response_code(502); echo '{"ok":false}'; exit; }
echo json_encode(['ok' => true, 'lead_id' => $leadId]);
