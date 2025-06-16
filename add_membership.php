<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Enable error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("add_membership.php called");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // SQL Server connection settings
    $serverName = "LAPTOP-ANQIBD69"; // Your SQL Server name
    $database = "lifthub";
    $uid = "sa";
    $pass = "admin123";
    
    // Configure SQL Server connection
    $connectionInfo = array(
        "Database" => $database,
        "Uid" => $uid,
        "PWD" => $pass,
        "CharacterSet" => "UTF-8",
        "TrustServerCertificate" => true
    );
    
    // Connect to SQL Server
    $conn = sqlsrv_connect($serverName, $connectionInfo);
    
    if ($conn === false) {
        throw new Exception("Connection failed: " . print_r(sqlsrv_errors(), true));
    }
    
    // Get request data
    $data = json_decode(file_get_contents("php://input"), true);
    error_log("Received data: " . json_encode($data));
    
    // Validate required fields
    if (!isset($data['userID']) || !isset($data['months'])) {
        throw new Exception("Missing required fields: userID and months");
    }
    
    // Validate months is positive integer
    $months = intval($data['months']);
    if ($months <= 0) {
        throw new Exception("Membership duration must be a positive number");
    }
    
    // Get current membership status
    $query = "SELECT membership FROM tbl_user WHERE userID = ?";
    $params = array($data['userID']);
    $stmt = sqlsrv_query($conn, $query, $params);
    
    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }
    
    if (sqlsrv_has_rows($stmt) === false) {
        throw new Exception("User not found");
    }
    
    $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
    $currentDate = new DateTime();
    
    // Calculate new membership date
    if (!empty($row['membership'])) {
        // Ensure we're handling SQL Server datetime correctly
        $membershipDate = $row['membership'] instanceof DateTime ? 
            $row['membership'] : 
            new DateTime($row['membership']);

        // If membership is still active, extend from that date
        $today = new DateTime();
        if ($membershipDate > $today) {
            $newExpiryDate = clone $membershipDate;
            $newExpiryDate->modify("+{$months} months");
        } else {
            // If membership expired, start from today
            $newExpiryDate = clone $today;
            $newExpiryDate->modify("+{$months} months");
        }
    } else {
        // No previous membership, start from today
        $newExpiryDate = new DateTime();
        $newExpiryDate->modify("+{$months} months");
    }
    
    // Format for SQL Server
    $formattedDate = $newExpiryDate->format('Y-m-d H:i:s');
    
    // Update user's membership date
    $updateSql = "UPDATE tbl_user SET membership = ? WHERE userID = ?";
    $updateParams = array($formattedDate, $data['userID']);
    $updateStmt = sqlsrv_query($conn, $updateSql, $updateParams);
    
    if ($updateStmt === false) {
        throw new Exception("Failed to update membership: " . print_r(sqlsrv_errors(), true));
    }
    
    // Get member name for logging
    $nameQuery = "SELECT fullName FROM tbl_user WHERE userID = ?";
    $nameParams = array($data['userID']);
    $nameStmt = sqlsrv_query($conn, $nameQuery, $nameParams);
    
    if ($nameStmt === false || !sqlsrv_has_rows($nameStmt)) {
        throw new Exception("Failed to get member name");
    }
    
    $memberRow = sqlsrv_fetch_array($nameStmt, SQLSRV_FETCH_ASSOC);
    $memberName = $memberRow['fullName'];
    
    // Get the staff name who is adding the membership
    $staffID = isset($data['staffID']) ? $data['staffID'] : 1; // Default to 1 if not provided
    $staffNameSql = "SELECT fullName FROM tbl_user WHERE userID = ?";
    $staffNameParams = array($staffID);
    $staffNameStmt = sqlsrv_query($conn, $staffNameSql, $staffNameParams);

    $staffName = "Unknown Staff";
    if ($staffNameStmt !== false && sqlsrv_has_rows($staffNameStmt)) {
        $staffRow = sqlsrv_fetch_array($staffNameStmt, SQLSRV_FETCH_ASSOC);
        $staffName = $staffRow['fullName'];
    }

    // Log the membership addition with the staff's name
    $logAction = "Added Membership";
    $logInfo = "$staffName added {$months} months membership for {$memberName}";

    $logSql = "INSERT INTO tbl_logs (userID, logDateTime, logAction, logInfo) VALUES (?, GETDATE(), ?, ?)";
    $logParams = array($staffID, $logAction, $logInfo);
    $logStmt = sqlsrv_query($conn, $logSql, $logParams);
    
    if ($logStmt === false) {
        error_log("Failed to log membership addition: " . print_r(sqlsrv_errors(), true));
    } else {
        error_log("Membership addition logged successfully");
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Membership updated successfully",
        "newExpiryDate" => $formattedDate
    ]);
    
} catch (Exception $e) {
    error_log("Error in add_membership.php: " . $e->getMessage());
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