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
error_log("add_workout_exercises.php called with data: " . file_get_contents('php://input'));

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
    if (!isset($data['workoutID']) || !isset($data['exercises']) || !is_array($data['exercises'])) {
        throw new Exception("Missing required fields");
    }
    
    // Connect to database
    $conn = sqlsrv_connect($serverName, $connectionInfo);
    if ($conn === false) {
        throw new Exception("Failed to connect to database: " . print_r(sqlsrv_errors(), true));
    }
    
    // Add each exercise one by one - no transaction to avoid rollback issues
    $successCount = 0;
    foreach ($data['exercises'] as $exercise) {
        $sql = "INSERT INTO tbl_routine (workoutID, exerciseName, sets, reps) VALUES (?, ?, ?, ?)";
        $params = array(
            $data['workoutID'],
            $exercise['exerciseName'],
            $exercise['sets'],
            $exercise['reps']
        );
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        
        if ($stmt !== false) {
            $successCount++;
        } else {
            error_log("Failed to add exercise: " . print_r(sqlsrv_errors(), true));
        }
    }
    
    // Return success if at least one exercise was added
    if ($successCount > 0) {
        echo json_encode([
            "success" => true,
            "message" => "$successCount exercises added successfully",
            "workoutID" => $data['workoutID']
        ]);
    } else {
        throw new Exception("Failed to add any exercises");
    }
    
} catch (Exception $e) {
    error_log("Error in add_workout_exercises.php: " . $e->getMessage());
    
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
