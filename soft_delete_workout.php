<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");

// Error handling function
function errorResponse($message, $errors = null, $code = 400) {
    http_response_code($code);
    die(json_encode([
        "success" => false,
        "message" => $message,
        "errors" => $errors
    ]));
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

// Connect to SQL Server
$conn = sqlsrv_connect($serverName, $connectionInfo);

if (!$conn) {
    die(json_encode(["error" => "Connection failed: " . print_r(sqlsrv_errors(), true)]));
}

// Get and validate the request data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (empty($data['id']) || empty($data['creatorID'])) {
    errorResponse("Workout ID and creator ID are required");
}

// Verify ownership before deletion
$verifySql = "SELECT workoutID FROM tbl_workout WHERE workoutID = ? AND creatorID = ?";
$verifyStmt = sqlsrv_query($conn, $verifySql, [$data['id'], $data['creatorID']]);

if ($verifyStmt === false || !sqlsrv_fetch($verifyStmt)) {
    errorResponse("Workout not found or permission denied", null, 403);
}

// Mark as deleted by prefixing the name with [DELETED]
$sql = "UPDATE tbl_workout SET workoutName = '[DELETED] ' + workoutName WHERE workoutID = ?";
$params = [$data['id']];
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    die(json_encode(["error" => "Soft delete failed: " . print_r(sqlsrv_errors(), true)]));
}

echo json_encode(["success" => true]);
sqlsrv_close($conn);
?>