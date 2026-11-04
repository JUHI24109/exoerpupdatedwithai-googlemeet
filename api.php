<?php
// PHP Reverse Proxy for API requests
error_reporting(0);
ini_set('display_errors', 0);

$backendUrl = "http://127.0.0.1:5000";

$requestUri = $_SERVER['REQUEST_URI']; 

if (strpos($requestUri, '/api/') !== 0) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid API route"]);
    exit;
}

$targetUrl = $backendUrl . $requestUri;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

$isMultipart = isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false;
$isPost = $_SERVER['REQUEST_METHOD'] === 'POST';

if ($isMultipart && $isPost) {
    $postFields = array();
    foreach ($_POST as $key => $value) {
        $postFields[$key] = $value;
    }
    foreach ($_FILES as $key => $file) {
        if (!is_array($file['tmp_name']) && $file['tmp_name'] !== '') {
            $postFields[$key] = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
        }
    }
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
} else {
    $input = file_get_contents('php://input');
    if ($input) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    }
}

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

$headers = [];
foreach (getallheaders() as $name => $value) {
    $lowerName = strtolower($name);
    // If we reconstructed the multipart form (POST only), we MUST drop original Length and Type headers.
    // If it's PUT/PATCH, we are proxying raw bytes, so we keep ALL original headers!
    if ($isMultipart && $isPost) {
        if ($lowerName !== 'host' && $lowerName !== 'content-length' && $lowerName !== 'content-type') {
            $headers[] = "$name: $value";
        }
    } else {
        if ($lowerName !== 'host') {
            $headers[] = "$name: $value";
        }
    }
}

// Only manually inject Content-Type if we stripped it during reconstruction
if ($isMultipart && $isPost === false && isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') === false) {
    // We didn't strip it, so we don't inject it twice.
} else if (!$isMultipart && isset($_SERVER['CONTENT_TYPE'])) {
    // For normal JSON POSTs etc, we kept it in getallheaders(), so we don't need to inject it twice.
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(502);
    echo json_encode(["error" => "Backend is down or unreachable.", "details" => curl_error($ch)]);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

http_response_code($httpCode);

$headersArr = explode("\r\n", $responseHeaders);
foreach ($headersArr as $header) {
    if (trim($header) && !preg_match('/^Transfer-Encoding:/i', $header)) {
        header($header);
    }
}

echo $responseBody;
?>
