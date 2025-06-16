<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Enable error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("add_member.php called");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // SQL Server connection settings
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

    // Get and validate request data
    $data = json_decode(file_get_contents("php://input"), true);
    error_log("Received data: " . json_encode($data));
    
    // Store the full name early for logging
    $fullName = trim($data['fullName']); // THIS IS THE CRITICAL FIX
    
    // Validate required fields
    $requiredFields = ['username', 'fullName', 'email', 'password', 'contactNum', 'userType'];
    $missingFields = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $missingFields[] = $field;
        }
    }
    
    if (!empty($missingFields)) {
        throw new Exception("Missing required fields: " . implode(", ", $missingFields));
    }

    if ($data['userType'] == 'member' && (!isset($data['membershipDuration']) || trim($data['membershipDuration']) === '')) {
        throw new Exception("Membership duration is required for member accounts");
    }
    
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }
    
    $checkUsername = "SELECT userID FROM tbl_user WHERE userName = ?";
    $params = array($data['username']);
    $stmt = sqlsrv_query($conn, $checkUsername, $params);
    
    if ($stmt === false) {
        throw new Exception("Username query error: " . print_r(sqlsrv_errors(), true));
    }
    
    if (sqlsrv_has_rows($stmt)) {
        throw new Exception("Username already exists");
    }
    
    $checkEmail = "SELECT userID FROM tbl_user WHERE email = ?";
    $params = array($data['email']);
    $stmt = sqlsrv_query($conn, $checkEmail, $params);
    
    if ($stmt === false) {
        throw new Exception("Email query error: " . print_r(sqlsrv_errors(), true));
    }
    
    if (sqlsrv_has_rows($stmt)) {
        throw new Exception("Email already exists");
    }
    
    $userType = $data['userType'];
    $qrPrefix = $userType === 'member' ? 'MEMBER' : ($userType === 'staff' ? 'STAFF' : 'TRAINER');
    $qrCode = $qrPrefix . "-" . $data['username'] . "-" . time();
    
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    $membershipDate = null;
    
    if ($data['userType'] == 'member' && isset($data['membershipDuration'])) {
        $membershipDuration = intval($data['membershipDuration']);
        if ($membershipDuration > 0) {
            $membershipDate = date('Y-m-d H:i:s', strtotime("+{$membershipDuration} months"));
        }
    }
    
    if (sqlsrv_begin_transaction($conn) === false) {
        throw new Exception("Failed to begin transaction");
    }

    $sql = "INSERT INTO tbl_user (userName, fullName, email, password, contactNum, qrCode, userType, membership) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $params = array(
        $data['username'],
        $fullName, // Using the stored fullName variable
        $data['email'],
        $hashedPassword,
        $data['contactNum'],
        $qrCode,
        $data['userType'],
        $membershipDate
    );
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    if ($stmt === false) {
        throw new Exception("Failed to add new member");
    }
    
    $userID = null;
    $getIDSql = "SELECT @@IDENTITY as newUserID";
    $getIDStmt = sqlsrv_query($conn, $getIDSql);
    
    if ($getIDStmt === false || !sqlsrv_fetch($getIDStmt)) {
        throw new Exception("Failed to retrieve new member ID");
    }
    
    $userID = sqlsrv_get_field($getIDStmt, 0);

    if ($data['userType'] === "member" && isset($data['membershipDuration'])) {
        $membershipDuration = intval($data['membershipDuration']);
        if ($membershipDuration > 0) {
            $membershipStartDate = date('Y-m-d');
            $membershipEndDate = date('Y-m-d', strtotime("+$membershipDuration months"));
            
            $membershipSql = "UPDATE tbl_user SET membership = ? WHERE userID = ?";
            $membershipParams = array($membershipEndDate, $userID);
            $membershipStmt = sqlsrv_query($conn, $membershipSql, $membershipParams);
            
            if ($membershipStmt === false) {
                throw new Exception("Failed to add membership");
            }
        }
    }
    
    usleep(500000);
    
    $staffID = isset($data['staffID']) ? $data['staffID'] : 1;
    
    $getStaffNameSql = "SELECT fullName FROM tbl_user WHERE userID = ?";
    $getStaffNameParams = array($staffID);
    $getStaffNameStmt = sqlsrv_query($conn, $getStaffNameSql, $getStaffNameParams);
    
    $staffName = "Unknown Staff";
    if ($getStaffNameStmt !== false && sqlsrv_has_rows($getStaffNameStmt)) {
        $staffRow = sqlsrv_fetch_array($getStaffNameStmt, SQLSRV_FETCH_ASSOC);
        $staffName = $staffRow['fullName'];
    }
    
    // Now using the properly stored $fullName variable
    $logAction = "Added Member";
    $logInfo = "{$staffName} added new {$userType}: {$fullName}";
    
    error_log("Adding log entry for: {$fullName}");

    $logSql = "INSERT INTO tbl_logs (userID, logDateTime, logAction, logInfo) VALUES (?, GETDATE(), ?, ?)";
    $logParams = array($staffID, $logAction, $logInfo);
    $logStmt = sqlsrv_query($conn, $logSql, $logParams);

    if ($logStmt === false) {
        error_log("Log failed for member: {$fullName}. Error: " . print_r(sqlsrv_errors(), true));
    } else {
        error_log("Successfully logged addition of: {$fullName}");
    }
    
    sqlsrv_commit($conn);
    
    echo json_encode([
        "success" => true,
        "message" => ucfirst($userType) . " added successfully",
        "userID" => $userID,
        "memberName" => $fullName // Returning the name for debugging
    ]);

} catch (Exception $e) {
    if (isset($conn) && sqlsrv_rollback($conn) === false) {
        error_log("Rollback failed: " . print_r(sqlsrv_errors(), true));
    }
    
    error_log("Error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        sqlsrv_close($conn);
    }
}
?>