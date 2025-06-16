<?php
// Set specific allowed origins instead of wildcard
$allowedOrigins = [
    'http://localhost:19006',
    'http://localhost:19000',
    'http://localhost:3000',
    'http://localhost:8081'
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Enable enhanced error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("reset_password.php called - Starting process");

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
        error_log("Connection failed: " . print_r(sqlsrv_errors(), true));
        throw new Exception("Database connection failed. Check server configuration.");
    } else {
        error_log("Database connection successful");
    }
    
    // Get request data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    error_log("Received data for password reset: " . $json);
    
    // Validate required fields
    if (!isset($data['userID']) || !isset($data['staffPassword'])) {
        throw new Exception("Missing required fields: userID and staffPassword");
    }
    
    // Log the received data (with password partially masked)
    $maskedPassword = substr($data['staffPassword'], 0, 2) . '***' . substr($data['staffPassword'], -2);
    error_log("Processing reset for userID: " . $data['userID'] . " with password: " . $maskedPassword);
    
    // For resetting password, we'll use a simpler approach - accept a fixed admin password
    // In a real app, you would verify against the logged-in staff's actual credentials
    $adminPassword = "password123"; // Simple fixed admin password for testing
    
    if ($data['staffPassword'] !== $adminPassword) {
        error_log("Password verification failed - incorrect staff password");
        throw new Exception("Invalid staff password");
    }
    
    error_log("Staff password verification successful, proceeding with reset");
    
    // Use a fixed password "JT123" instead of generating a random one
    $newPassword = "JT123";
    
    // Hash the new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    error_log("New password set to JT123 and hashed");
    
    // Update user's password - Correct SQL Server syntax
    $updateSql = "UPDATE tbl_user SET password = ? WHERE userID = ?";
    $updateParams = array($hashedPassword, $data['userID']);
    $updateStmt = sqlsrv_query($conn, $updateSql, $updateParams);
    
    if ($updateStmt === false) {
        error_log("Failed to update password: " . print_r(sqlsrv_errors(), true));
        throw new Exception("Failed to reset password. Database error.");
    }
    
    // Check if any rows were affected
    $rowsAffected = sqlsrv_rows_affected($updateStmt);
    if ($rowsAffected == 0) {
        error_log("No rows were affected by the update. User ID might not exist.");
        throw new Exception("User not found with ID: " . $data['userID']);
    }
    
    error_log("Password updated successfully. Rows affected: " . $rowsAffected);
    
    // Get member name for logging
    $nameQuery = "SELECT fullName FROM tbl_user WHERE userID = ?";
    $nameParams = array($data['userID']);
    $nameStmt = sqlsrv_query($conn, $nameQuery, $nameParams);
    
    if ($nameStmt === false) {
        error_log("Error getting user name: " . print_r(sqlsrv_errors(), true));
    }
    
    $memberName = "Unknown";
    if ($nameStmt && sqlsrv_has_rows($nameStmt)) {
        $row = sqlsrv_fetch_array($nameStmt, SQLSRV_FETCH_ASSOC);
        $memberName = $row['fullName'];
    }
    
    // Get the staff user's name who is performing this reset
    $staffID = isset($data['staffID']) ? $data['staffID'] : 1; // Default to 1 if not provided
    $staffNameSql = "SELECT fullName FROM tbl_user WHERE userID = ?";
    $staffNameParams = array($staffID);
    $staffNameStmt = sqlsrv_query($conn, $staffNameSql, $staffNameParams);

    $staffName = "Unknown Staff";
    if ($staffNameStmt !== false && sqlsrv_has_rows($staffNameStmt)) {
        $staffRow = sqlsrv_fetch_array($staffNameStmt, SQLSRV_FETCH_ASSOC);
        $staffName = $staffRow['fullName'];
    }

    // Log the password reset using the staff member's ID and name
    $logAction = "Reset password";
    $logInfo = "$staffName reset password for member: {$memberName}";
    
    $logSql = "INSERT INTO tbl_logs (userID, logDateTime, logAction, logInfo) VALUES (?, GETDATE(), ?, ?)";
    $logParams = array($staffID, $logAction, $logInfo);
    $logStmt = sqlsrv_query($conn, $logSql, $logParams);
    
    if ($logStmt === false) {
        error_log("Warning: Failed to log password reset activity: " . print_r(sqlsrv_errors(), true));
    } else {
        error_log("Password reset logged successfully");
    }
    
    // Return success response with the new password
    echo json_encode([
        "success" => true,
        "message" => "Password reset successfully",
        "newPassword" => $newPassword
    ]);
    error_log("Password reset process completed successfully");
    
} catch (Exception $e) {
    error_log("Error in reset_password.php: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
        error_log("Database connection closed");
    }
}
?>