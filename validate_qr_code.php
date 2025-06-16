<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Add detailed error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("validate_qr_code.php called");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

try {
    // Connect to SQL Server
    $conn = sqlsrv_connect($serverName, $connectionInfo);

    if ($conn === false) {
        throw new Exception("Connection failed: " . print_r(sqlsrv_errors(), true));
    }

    // Get QR code from request
    $qrCode = isset($_GET['qrCode']) ? $_GET['qrCode'] : null;

    if (!$qrCode) {
        throw new Exception("QR code is required");
    }
    
    error_log("Validating QR code: " . $qrCode);

    // Check if it's a day pass format (manual entry)
    if (strpos($qrCode, 'DAYPASS-') === 0) {
        $name = substr($qrCode, 8); // Remove 'DAYPASS-' prefix
        echo json_encode([
            "success" => true,
            "userExists" => false,
            "isDayPass" => true,
            "name" => $name
        ]);
        exit();
    }

    // Check if user exists in the database
    $sql = "SELECT userID, userName, fullName, userType, qrCode FROM tbl_user WHERE qrCode = ?";
    $params = array($qrCode);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }

    if (sqlsrv_has_rows($stmt)) {
        // User exists
        $user = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
        
        error_log("User found: " . $user['fullName']);
        
        // Check if user already has an entry today
        // Use CONVERT to get just the date part of GETDATE()
        $checkEntrySql = "SELECT logID FROM tbl_logs 
                         WHERE userID = ? AND logAction = 'Entered the gym' 
                         AND CONVERT(date, logDateTime) = CONVERT(date, GETDATE())";
        $checkEntryParams = array($user['userID']);
        $checkEntryStmt = sqlsrv_query($conn, $checkEntrySql, $checkEntryParams);
        
        if ($checkEntryStmt === false) {
            throw new Exception("Entry check query failed: " . print_r(sqlsrv_errors(), true));
        }
        
        if (sqlsrv_has_rows($checkEntryStmt)) {
            // User already has an entry today
            error_log("User already entered today: " . $user['fullName']);
            echo json_encode([
                "success" => true,
                "userExists" => true,
                "user" => $user,
                "alreadyEntered" => true,
                "message" => "You have already entered the gym today."
            ]);
        } else {
            // User exists and hasn't entered today
            error_log("User can enter: " . $user['fullName']);
            echo json_encode([
                "success" => true,
                "userExists" => true,
                "user" => $user,
                "alreadyEntered" => false
            ]);
        }
    } else {
        // User not found
        error_log("User with QR code not found: " . $qrCode);
        echo json_encode([
            "success" => true,
            "userExists" => false,
            "isDayPass" => false,
            "qrCode" => $qrCode
        ]);
    }
} catch (Exception $e) {
    error_log("Error in validate_qr_code.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>
