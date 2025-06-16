<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Add detailed error logging to help track down the issue
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("add_trainee.php called");

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

// Configure SQL Server connection
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

    // Get and parse request body
    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Received input: " . json_encode($input));

    // Validate input
    if (!isset($input['trainerID']) || !isset($input['userName'])) {
        throw new Exception("Trainer ID and username are required");
    }

    $trainerID = $input['trainerID'];
    $userName = $input['userName'];

    // First, check if the user exists and is a member
    $checkUserSql = "SELECT userID, userType FROM tbl_user WHERE userName = ?";
    $checkUserParams = array($userName);
    $checkUserStmt = sqlsrv_query($conn, $checkUserSql, $checkUserParams);
    
    if ($checkUserStmt === false) {
        throw new Exception("Failed to check user: " . print_r(sqlsrv_errors(), true));
    }
    
    if (sqlsrv_has_rows($checkUserStmt) === false) {
        throw new Exception("User not found");
    }
    
    $userRow = sqlsrv_fetch_array($checkUserStmt, SQLSRV_FETCH_ASSOC);
    $memberID = $userRow['userID'];
    
    if ($userRow['userType'] !== 'member') {
        throw new Exception("Selected user is not a member");
    }

    // Check if assignment already exists - FIXED TABLE NAME TO MATCH YOUR SCHEMA
    $checkAssignmentSql = "SELECT assignmentID FROM tbl_trainerAssignment 
                          WHERE trainerID = ? AND memberID = ?";
    $checkAssignmentParams = array($trainerID, $memberID);
    $checkAssignmentStmt = sqlsrv_query($conn, $checkAssignmentSql, $checkAssignmentParams);
    
    if ($checkAssignmentStmt === false) {
        throw new Exception("Failed to check assignment: " . print_r(sqlsrv_errors(), true));
    }
    
    if (sqlsrv_has_rows($checkAssignmentStmt)) {
        throw new Exception("This member is already assigned to you");
    }

    // Insert new assignment - FIXED TABLE NAME TO MATCH YOUR SCHEMA
    $insertSql = "INSERT INTO tbl_trainerAssignment (trainerID, memberID, assignmentDate) 
                 VALUES (?, ?, GETDATE())";
    $insertParams = array($trainerID, $memberID);
    $insertStmt = sqlsrv_query($conn, $insertSql, $insertParams);
    
    if ($insertStmt === false) {
        throw new Exception("Failed to assign trainee: " . print_r(sqlsrv_errors(), true));
    }

    // Get the assigned member's details for response
    $memberDetailsSql = "SELECT u.userID as id, u.fullName as name, u.email, 
                        FORMAT(a.assignmentDate, 'yyyy-MM-dd') as assignmentDate
                        FROM tbl_user u
                        JOIN tbl_trainerAssignment a ON u.userID = a.memberID
                        WHERE a.trainerID = ? AND u.userID = ?";
    $memberDetailsParams = array($trainerID, $memberID);
    $memberDetailsStmt = sqlsrv_query($conn, $memberDetailsSql, $memberDetailsParams);
    
    if ($memberDetailsStmt === false) {
        throw new Exception("Failed to get member details: " . print_r(sqlsrv_errors(), true));
    }
    
    $memberDetails = sqlsrv_fetch_array($memberDetailsStmt, SQLSRV_FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "message" => "Trainee added successfully",
        "trainee" => $memberDetails
    ]);
    
} catch (Exception $e) {
    error_log("Error in add_trainee.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
} finally {
    // Close connection if it exists
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>