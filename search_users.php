<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Add detailed error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("search_users.php called");

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

    // Get search query from request
    $query = isset($_GET['query']) ? $_GET['query'] : '';
    error_log("Search query: " . $query);

    if (empty($query) || strlen($query) < 2) {
        echo json_encode([
            "success" => true,
            "users" => []
        ]);
        exit();
    }

    // Search for users (members and trainers only), now also by qrCode
    $sql = "SELECT userID, userName, fullName, userType, qrCode 
            FROM tbl_user 
            WHERE (userType = 'member' OR userType = 'trainer') AND 
                  (fullName LIKE ? OR userName LIKE ? OR qrCode LIKE ?)
            ORDER BY fullName
            OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY";
    
    $searchParam = '%' . $query . '%';
    $params = array($searchParam, $searchParam, $searchParam);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }

    $users = array();
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $users[] = array(
            "id" => $row['userID'],
            "userName" => $row['userName'],
            "fullName" => $row['fullName'],
            "userType" => $row['userType'],
            "qrCode" => $row['qrCode'] ?: "LIFTHUB-" . $row['userType'] . "-" . $row['userID']
        );
    }
    
    error_log("Found " . count($users) . " users matching query");
    echo json_encode([
        "success" => true,
        "users" => $users
    ]);
    
} catch (Exception $e) {
    error_log("Error in search_users.php: " . $e->getMessage());
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
