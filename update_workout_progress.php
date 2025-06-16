<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
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

    // Validate required fields
    if (!isset($data['workoutID']) || !isset($data['memberID']) || !isset($data['status'])) {
        throw new Exception("workoutID, memberID, and status are required");
    }

    $workoutID = $data['workoutID'];
    $memberID = $data['memberID'];
    $status = $data['status'];

    // Validate status
    if (!in_array($status, ['Assigned', 'In Progress', 'Completed'])) {
        throw new Exception("Invalid status. Must be 'Assigned', 'In Progress', or 'Completed'");
    }

    // Verify the workout is assigned to this member
    $checkSql = "SELECT workoutID FROM tbl_workout WHERE workoutID = ? AND assignedToID = ?";
    $checkParams = array($workoutID, $memberID);
    $checkStmt = sqlsrv_query($conn, $checkSql, $checkParams);

    if ($checkStmt === false || !sqlsrv_has_rows($checkStmt)) {
        throw new Exception("Workout not found or not assigned to this member");
    }

    // Update the workout progress
    $updateSql = "UPDATE tbl_workout SET workoutProgress = ? WHERE workoutID = ?";
    $updateParams = array($status, $workoutID);
    $updateStmt = sqlsrv_query($conn, $updateSql, $updateParams);

    if ($updateStmt === false) {
        throw new Exception("Failed to update workout progress");
    }

    echo json_encode([
        "success" => true,
        "message" => "Workout progress updated to " . $status
    ]);
    
} catch (Exception $e) {
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
