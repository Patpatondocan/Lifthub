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
error_log("update_workout_details.php called with data: " . file_get_contents('php://input'));

// Database connection info - directly included instead of using require_once
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
    if (!isset($data['workoutID']) || !isset($data['workoutName']) || 
        !isset($data['creatorID'])) {
        throw new Exception("Missing required fields");
    }
    
    // Connect to database
    $conn = sqlsrv_connect($serverName, $connectionInfo);
    if ($conn === false) {
        throw new Exception("Failed to connect to database: " . print_r(sqlsrv_errors(), true));
    }
    
    // Simple update query - just update the workout details
    $sql = "UPDATE tbl_workout SET 
            workoutName = ?, 
            workoutDesc = ?, 
            workoutLevel = ? 
            WHERE workoutID = ? AND creatorID = ?";
            
    $params = array(
        $data['workoutName'],
        $data['workoutDesc'] ?? '',
        $data['workoutLevel'] ?? 'Beginner',
        $data['workoutID'],
        $data['creatorID']
    );
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    
    if ($stmt === false) {
        throw new Exception("Failed to update workout: " . print_r(sqlsrv_errors(), true));
    }
    
    // Return success response
    echo json_encode([
        "success" => true,
        "message" => "Workout details updated successfully",
        "workoutID" => $data['workoutID']
    ]);
    
} catch (Exception $e) {
    error_log("Error in update_workout_details.php: " . $e->getMessage());
    
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
