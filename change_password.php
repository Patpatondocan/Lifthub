<?php
// Add error logging
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Disable error display but keep logging
error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    // Log incoming request
    error_log("Received password change request");
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input: ' . json_last_error_msg());
    }
    
    // Log parsed input (excluding sensitive data)
    error_log("UserID received: " . ($input['userID'] ?? 'not set'));
    
    // Validate input
    if (!isset($input['userID']) || !isset($input['currentPassword']) || !isset($input['newPassword'])) {
        throw new Exception('Missing required fields');
    }

    // Database connection
    $serverName = "LAPTOP-ANQIBD69";
    $connectionInfo = array(
        "Database" => "lifthub",
        "Uid" => "sa",
        "PWD" => "admin123",
        "CharacterSet" => "UTF-8"
    );

    $conn = sqlsrv_connect($serverName, $connectionInfo);
    if ($conn === false) {
        throw new Exception("Connection failed: " . print_r(sqlsrv_errors(), true));
    }

    // Check current password
    $checkSql = "SELECT password FROM tbl_user WHERE userID = ?";
    $params = array($input['userID']);
    $stmt = sqlsrv_query($conn, $checkSql, $params);

    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }

    $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    if (!$row) {
        throw new Exception("User not found");
    }

    if (!password_verify($input['currentPassword'], $row['password'])) {
        throw new Exception("Current password is incorrect");
    }

    // Update password
    $newHash = password_hash($input['newPassword'], PASSWORD_DEFAULT);
    $updateSql = "UPDATE tbl_user SET password = ? WHERE userID = ?";
    $params = array($newHash, $input['userID']);
    
    $stmt = sqlsrv_query($conn, $updateSql, $params);
    
    if ($stmt === false) {
        throw new Exception("Update failed: " . print_r(sqlsrv_errors(), true));
    }

    echo json_encode([
        'success' => true,
        'message' => 'Password updated successfully'
    ]);

} catch (Exception $e) {
    error_log("Password change error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        sqlsrv_close($conn);
    }
}
?>