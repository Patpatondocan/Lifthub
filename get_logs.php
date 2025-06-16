<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Add detailed error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("get_logs.php called");

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

    // Get query parameters
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    $searchQuery = isset($_GET['search']) ? $_GET['search'] : '';
    
    // Join with user table to get the username
    $sql = "SELECT l.logID, l.userID, l.logDateTime, l.logAction, l.logInfo, u.userName, u.fullName 
            FROM tbl_logs l
            LEFT JOIN tbl_user u ON l.userID = u.userID
            WHERE 
                l.logAction LIKE ? OR 
                l.logInfo LIKE ? OR 
                u.userName LIKE ? OR 
                u.fullName LIKE ?
            ORDER BY l.logDateTime DESC
            OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
    
    $searchTerm = '%' . $searchQuery . '%';
    $params = array($searchTerm, $searchTerm, $searchTerm, $searchTerm, $offset, $limit);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }

    // Count total logs (for pagination)
    $countSql = "SELECT COUNT(*) as total 
                FROM tbl_logs l
                LEFT JOIN tbl_user u ON l.userID = u.userID
                WHERE 
                    l.logAction LIKE ? OR 
                    l.logInfo LIKE ? OR 
                    u.userName LIKE ? OR 
                    u.fullName LIKE ?";
    
    $countParams = array($searchTerm, $searchTerm, $searchTerm, $searchTerm);
    $countStmt = sqlsrv_query($conn, $countSql, $countParams);
    
    if ($countStmt === false) {
        throw new Exception("Count query failed: " . print_r(sqlsrv_errors(), true));
    }
    
    $totalCount = 0;
    if (sqlsrv_fetch($countStmt)) {
        $totalCount = sqlsrv_get_field($countStmt, 0);
    }

    // Ensure we're returning the formatted data with username and fullName
    $logs = array();
    
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        // Format the datetime for display
        $dateTimeObj = $row['logDateTime'];
        $formattedDate = $dateTimeObj instanceof DateTime ? 
                        $dateTimeObj->format('Y-m-d H:i:s') : 
                        date('Y-m-d H:i:s', strtotime($dateTimeObj));
        
        $logs[] = array(
            'id' => $row['logID'],
            'userId' => $row['userID'],
            'userName' => $row['userName'] ?? 'Unknown',
            'fullName' => $row['fullName'] ?? 'Unknown User',
            'dateTime' => $formattedDate,
            'action' => $row['logAction'],
            'info' => $row['logInfo'],
        );
    }
    
    echo json_encode([
        "success" => true,
        "logs" => $logs,
        "total" => $totalCount,
        "limit" => $limit,
        "offset" => $offset
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_logs.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>
