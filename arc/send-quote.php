<?php
/* ARC website enquiry handler -> emails quotes@thearcgroup.com.au
   Accepts a JSON (or form-encoded) POST from the site's quote forms. */

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = $_POST; }

// honeypot: real users never fill this; bots do
if (!empty($data['company'])) { echo json_encode(['ok' => true]); exit; }

function f($a, $k) { return isset($a[$k]) ? trim((string)$a[$k]) : ''; }
function h($s) { return trim(str_replace(["\r", "\n", "%0a", "%0d"], ' ', (string)$s)); } // header-safe

$name      = h(f($data, 'name'));
$email     = h(f($data, 'email'));
$phone     = h(f($data, 'phone'));
$suburb    = h(f($data, 'suburb'));
$service   = h(f($data, 'service'));
$frequency = h(f($data, 'frequency'));
$message   = trim(f($data, 'message'));
$pageref   = h(f($data, 'page'));

$errors = [];
if ($name === '') $errors[] = 'name';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email';
if ($phone === '') $errors[] = 'phone';
if ($errors) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Missing or invalid: ' . implode(', ', $errors)]);
    exit;
}

$to      = 'quotes@thearcgroup.com.au';
$subject = 'New website enquiry' . ($service !== '' ? ' - ' . $service : '') . ' (' . $name . ')';

$body  = "New enquiry from the ARC Home Services Group website\n";
$body .= str_repeat('-', 48) . "\n\n";
$body .= "Name:       $name\n";
$body .= "Email:      $email\n";
$body .= "Phone:      $phone\n";
if ($suburb !== '')    $body .= "Suburb:     $suburb\n";
if ($service !== '')   $body .= "Service:    $service\n";
if ($frequency !== '') $body .= "Frequency:  $frequency\n";
if ($message !== '')   $body .= "\nMessage:\n$message\n";
$body .= "\n" . str_repeat('-', 48) . "\n";
if ($pageref !== '')   $body .= "Page:       $pageref\n";
$body .= "IP:         " . ($_SERVER['REMOTE_ADDR'] ?? '') . "\n";
$body .= "Time:       " . date('Y-m-d H:i:s') . "\n";

// From must be on a domain local to the sending server, or the MTA rejects it.
$host = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? 'thearcgroup.com.au');
$host = preg_replace('/^www\./i', '', $host);
$fromAddr = 'no-reply@' . $host;

$headers  = [];
$headers[] = 'From: ARC Website Enquiry <' . $fromAddr . '>';
$headers[] = 'Reply-To: ' . ($name !== '' ? $name . ' ' : '') . '<' . $email . '>';
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: ARC-Form';
$headersStr = implode("\r\n", $headers);

// try with explicit envelope sender; fall back to the server default if refused
$sent = @mail($to, $subject, $body, $headersStr, '-f ' . $fromAddr);
if (!$sent) { $sent = @mail($to, $subject, $body, $headersStr); }

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Mail send failed']);
}
