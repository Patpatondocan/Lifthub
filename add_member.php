<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = [
    'success' => false,
    'message' => '',
    'userID' => null
];

try {
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    $required = ['username', 'fullname', 'password', 'userType', 'currentUserType'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Check permissions - Staff can't add other staff
    if ($input['currentUserType'] === 'staff' && $input['userType'] === 'staff') {
        throw new Exception("Staff members cannot add other staff accounts");
    }

    // Database configuration
    $serverName = "LAPTOP-ANQIBD69";
    $database = "lifthub";
    $uid = "sa";
    $pass = "admin123";

    $connectionInfo = array(
        "Database" => $database,
        "Uid" => $uid,
        "PWD" => $pass,
        "CharacterSet" => "UTF-8",
        "TrustServerCertificate" => true
    );

    $conn = sqlsrv_connect($serverName, $connectionInfo);
    
    if ($conn === false) {
        throw new Exception("Connection failed: " . print_r(sqlsrv_errors(), true));
    }

    // Check if username already exists
    $checkSql = "SELECT userID FROM tbl_user WHERE userName = ?";
    $checkParams = [$input['username']];
    $checkStmt = sqlsrv_query($conn, $checkSql, $checkParams);
    
    if (sqlsrv_has_rows($checkStmt)) {
        throw new Exception("Username already exists");
    }

    // Insert new member
    $insertSql = "INSERT INTO tbl_user 
                 (userName, fullName, email, contactNum, password, userType) 
                 VALUES (?, ?, ?, ?, ?, ?)";
    
    $insertParams = [
        $input['username'],
        $input['fullname'],
        $input['email'] ?? null,
        $input['contactNum'] ?? null,
        password_hash($input['password'], PASSWORD_DEFAULT),
        $input['userType']
    ];

    $insertStmt = sqlsrv_query($conn, $insertSql, $insertParams);
    
    if ($insertStmt === false) {
        throw new Exception("Insert failed: " . print_r(sqlsrv_errors(), true));
    }

    // Get the new user ID
    $idSql = "SELECT SCOPE_IDENTITY() AS newID";
    $idStmt = sqlsrv_query($conn, $idSql);
    $row = sqlsrv_fetch_array($idStmt, SQLSRV_FETCH_ASSOC);
    
    $response = [
        'success' => true,
        'message' => 'User added successfully',
        'userID' => (int)$row['newID']
    ];

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    http_response_code(400);
} finally {
    if (isset($conn)) {
        sqlsrv_close($conn);
    }
    
    echo json_encode($response);
    exit();
}
?>