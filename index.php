<?php
$uri = $_SERVER['REQUEST_URI'];

// Stop infinite redirect loops for API calls
if (strpos($uri, '/api/') === 0) {
    header("HTTP/1.1 502 Bad Gateway");
    echo json_encode(["error" => "Backend API is not running or not reachable."]);
    exit;
}

// Redirect all other requests to frontend
header('Location: /frontend/index.html');
exit;
?>
