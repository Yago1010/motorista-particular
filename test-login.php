<?php
// Teste de login via API
$postData = array(
    'email' => 'motorista@demo.local',
    'password' => 'Admin123!',
    'device_token' => 'test-device-token-123',
    'device_type' => 'android',
    'login_by' => 'manual'
);

$ch = curl_init('http://127.0.0.1:8888/provider/login');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";
echo $response . "\n";
