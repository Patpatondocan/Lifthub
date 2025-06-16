<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Disable error reporting for production
error_reporting(0);
ini_set('display_errors', 0);

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['userID'])) {
        throw new Exception('User ID is required');
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

    // Update user profile
    $updateSql = "UPDATE tbl_user SET 
                  fullName = ?, 
                  email = ?, 
                  contactNum = ? 
                  WHERE userID = ?";
    
    $params = array(
        $input['fullName'],
        $input['email'],
        $input['contactNum'],
        $input['userID']
    );
    
    $stmt = sqlsrv_query($conn, $updateSql, $params);
    
    if ($stmt === false) {
        throw new Exception("Update failed: " . print_r(sqlsrv_errors(), true));
    }

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully'
    ]);

} catch (Exception $e) {
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