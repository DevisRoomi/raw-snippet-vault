<?php
/**
 * Raw Snippet Vault - Laravel Herd Gateway
 * Proxies /api requests to Bun+Hono (port 3003) and serves archival SPA assets.
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1. Forward /api requests to Bun + Hono backend
if (str_starts_with($uri, '/api')) {
    $backendUrl = 'http://127.0.0.1:3003' . $_SERVER['REQUEST_URI'];

    $ch = curl_init($backendUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

    // Forward request body
    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
        $body = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    // Forward request headers
    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (str_starts_with($key, 'HTTP_')) {
            $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
            if (!in_array(strtolower($name), ['host', 'content-length'])) {
                $headers[] = "$name: $value";
            }
        } elseif (in_array($key, ['CONTENT_TYPE', 'CONTENT_LENGTH'])) {
            $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', $key))));
            $headers[] = "$name: $value";
        }
    }
    // Explicitly guarantee Content-Type if present
    if (isset($_SERVER['CONTENT_TYPE']) && !empty($_SERVER['CONTENT_TYPE'])) {
        $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_unique($headers));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($response === false) {
        http_response_code(502);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Raw Snippet Vault Backend (Bun:3003) is unreachable.'
        ]);
        exit;
    }

    http_response_code($httpCode ?: 200);
    if ($contentType) {
        header("Content-Type: $contentType");
    }
    echo $response;
    exit;
}

// 2. Serve static assets from dist/
$distPath = __DIR__ . '/dist';
$filePath = $distPath . $uri;

if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    $ext = pathinfo($filePath, PATHINFO_EXTENSION);
    $mimes = [
        'js'    => 'application/javascript',
        'css'   => 'text/css',
        'svg'   => 'image/svg+xml',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'webp'  => 'image/webp',
        'json'  => 'application/json',
        'ico'   => 'image/x-icon',
        'woff2' => 'font/woff2',
        'woff'  => 'font/woff',
        'ttf'   => 'font/ttf',
    ];
    if (isset($mimes[$ext])) {
        header("Content-Type: {$mimes[$ext]}");
    }
    readfile($filePath);
    exit;
}

// 3. Fallback to index.html
$indexFile = $distPath . '/index.html';
if (file_exists($indexFile)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($indexFile);
    exit;
}

echo "<h1>Raw Snippet Vault</h1><p>Building frontend assets...</p>";
