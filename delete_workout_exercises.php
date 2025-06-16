<?php
// Headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Debug logging
error_log("delete_workout_exercises.php called with data: " . file_get_contents('php://input'));

// Database connection info
$serverName = "LAPTOP-ANQIBD69"; // Your SQL Server name
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
    // Parse request body
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    if (!isset($data['workoutID'])) {
        throw new Exception("Missing required workoutID");
    }
    
    // Connect to database
    $conn = sqlsrv_connect($serverName, $connectionInfo);
    if ($conn === false) {
        throw new Exception("Failed to connect to database: " . print_r(sqlsrv_errors(), true));
    }
    
    // Simply delete the exercises - note that this permanently removes data
    $sql = "DELETE FROM tbl_routine WHERE workoutID = ?";
    $params = array($data['workoutID']);
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if ($stmt === false) {
        throw new Exception("Failed to delete exercises: " . print_r(sqlsrv_errors(), true));
    }
    
    // Return success response
    echo json_encode([
        "success" => true,
        "message" => "Exercises deleted successfully",
        "workoutID" => $data['workoutID']
    ]);
    
} catch (Exception $e) {
    error_log("Error in delete_workout_exercises.php: " . $e->getMessage());
    
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
} finally {
    // Close the connection
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>
