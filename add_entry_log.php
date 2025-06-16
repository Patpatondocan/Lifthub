<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

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

    // Get the request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Check for required fields
    if ((empty($data['userId']) && !isset($data['isDayPass'])) || empty($data['loggedBy'])) {
        throw new Exception("Missing required fields");
    }

    $loggedByUserId = $data['loggedBy']; // Admin or staff who logs this entry
    
    // Get details of the admin/staff who is logging this entry
    $adminSql = "SELECT userID, userName, fullName FROM tbl_user WHERE userID = ?";
    $adminParams = array($loggedByUserId);
    $adminStmt = sqlsrv_query($conn, $adminSql, $adminParams);
    
    if ($adminStmt === false || !sqlsrv_has_rows($adminStmt)) {
        throw new Exception("Invalid staff/admin ID");
    }
    
    $admin = sqlsrv_fetch_array($adminStmt, SQLSRV_FETCH_ASSOC);
    
    // Handle day pass entry
    if (isset($data['isDayPass']) && $data['isDayPass'] && !empty($data['visitorName'])) {
        $visitorName = $data['visitorName'];
        
        // Create a log for day pass
        $logSql = "INSERT INTO tbl_logs (userID, logDateTime, logAction, logInfo) 
                  VALUES (?, GETDATE(), ?, ?)";
        $logInfo = "Day pass visitor " . $visitorName . " entered the gym";
        $logParams = array(
            $loggedByUserId,
            "Visitor entry",
            $logInfo
        );
        
        $logStmt = sqlsrv_query($conn, $logSql, $logParams);
        
        if ($logStmt === false) {
            throw new Exception("Failed to create day pass log: " . print_r(sqlsrv_errors(), true));
        }
        
        echo json_encode([
            "success" => true,
            "message" => $visitorName . " has entered the gym with a day pass"
        ]);
    } else {
        // Handle regular member/trainer entry
        $userId = $data['userId'];
        
        // Get user details
        $userSql = "SELECT userID, userName, fullName, userType FROM tbl_user WHERE userID = ?";
        $userParams = array($userId);
        $userStmt = sqlsrv_query($conn, $userSql, $userParams);
        
        if ($userStmt === false || !sqlsrv_has_rows($userStmt)) {
            throw new Exception("User not found");
        }
        
        $user = sqlsrv_fetch_array($userStmt, SQLSRV_FETCH_ASSOC);
        
        // Check if the user has already entered today
        $checkEntrySql = "SELECT logID FROM tbl_logs 
                         WHERE userID = ? AND logAction = 'Entered the gym' 
                         AND CONVERT(date, logDateTime) = CONVERT(date, GETDATE())";
        $checkEntryParams = array($userId);
        $checkEntryStmt = sqlsrv_query($conn, $checkEntrySql, $checkEntryParams);
        
        if ($checkEntryStmt === false) {
            throw new Exception("Entry check query failed: " . print_r(sqlsrv_errors(), true));
        }
        
        if (sqlsrv_has_rows($checkEntryStmt)) {
            // User already entered today
            echo json_encode([
                "success" => false,
                "alreadyEntered" => true,
                "message" => $user['fullName'] . " has already entered the gym today"
            ]);
            exit();
        }
        
        // Create entry log
        $logSql = "INSERT INTO tbl_logs (userID, logDateTime, logAction, logInfo) 
                  VALUES (?, GETDATE(), ?, ?)";
        $logInfo = $user['fullName'] . " (" . $user['userType'] . ") entered the gym";
        $logParams = array($userId, "Entered the gym", $logInfo);
        
        $logStmt = sqlsrv_query($conn, $logSql, $logParams);
        
        if ($logStmt === false) {
            throw new Exception("Failed to create entry log: " . print_r(sqlsrv_errors(), true));
        }
        
        echo json_encode([
            "success" => true,
            "message" => $user['fullName'] . " has entered the gym"
        ]);
    }
} catch (Exception $e) {
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
