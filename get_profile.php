<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

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

$response = ['success' => false, 'message' => ''];

try {
    // Connect to SQL Server
    $conn = sqlsrv_connect($serverName, $connectionInfo);
    
    if ($conn === false) {
        throw new Exception("Connection failed: " . print_r(sqlsrv_errors(), true));
    }
    
    // Get user ID from request
    if (!isset($_GET['userID'])) {
        throw new Exception("User ID is required");
    }
    
    $userID = $_GET['userID'];
    
    // Query to get user profile with proper date formatting
    $sql = "SELECT userID, userName, fullName, email, contactNum, userType, qrCode,
                  CONVERT(varchar, membership, 127) as membership
           FROM tbl_user 
           WHERE userID = ?";
    
    $params = array($userID);
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }
    
    // Check if user exists
    if (sqlsrv_has_rows($stmt) === false) {
        throw new Exception("User not found");
    }
    
    // Fetch the user data
    $user = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    
    // If user is a trainer, get assigned trainees count (only active assignments)
    if ($user['userType'] === 'trainer') {
        $countSql = "SELECT COUNT(*) as count FROM tbl_trainerAssignment WHERE trainerID = ? AND isActive = 1";
        $countParams = array($userID);
        $countStmt = sqlsrv_query($conn, $countSql, $countParams);
        
        if ($countStmt !== false && sqlsrv_fetch($countStmt)) {
            $user['assignedTrainees'] = sqlsrv_get_field($countStmt, 0);
        } else {
            $user['assignedTrainees'] = 0;
        }
    }
    
    // Calculate membership status
    $currentTime = time();
    $membershipTimestamp = strtotime($user['membership']); // FIXED: use strtotime for ISO string
    
    // Add membership status and expiry info
    $user['membershipStatus'] = $membershipTimestamp > $currentTime ? 'active' : 'inactive';
    $user['membershipExpiry'] = $membershipTimestamp > 0 ? date('Y-m-d H:i:s', $membershipTimestamp) : null;
    $user['daysRemaining'] = $membershipTimestamp > $currentTime ? 
        ceil(($membershipTimestamp - $currentTime) / (24 * 60 * 60)) : 0;

    $response = [
        'success' => true,
        'user' => $user
    ];

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    http_response_code(400);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
    echo json_encode($response);
}
?>