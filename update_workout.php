<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");

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
    die(json_encode([
        "error" => "Connection failed",
        "details" => sqlsrv_errors()
    ]));
}

try {
    // Get and validate request data
    $data = json_decode(file_get_contents("php://input"), true);

    // Check for required fields
    $requiredFields = ['id', 'name', 'description', 'difficulty', 'exercises', 'creatorID'];
    $missingFields = [];

    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            $missingFields[] = $field;
        }
    }

    if (!empty($missingFields)) {
        throw new Exception("Missing required fields: " . implode(", ", $missingFields));
    }

    // Validate exercises before attempting any database operations
    foreach ($data['exercises'] as $index => $exercise) {
        if (empty(trim($exercise['name']))) {
            throw new Exception("Exercise name cannot be empty at position " . ($index + 1));
        }
        if (!is_numeric($exercise['sets']) || $exercise['sets'] <= 0) {
            throw new Exception("Invalid sets value at position " . ($index + 1));
        }
        if (!is_numeric($exercise['reps']) || $exercise['reps'] <= 0) {
            throw new Exception("Invalid reps value at position " . ($index + 1));
        }
    }

    // Begin transaction
    if (sqlsrv_begin_transaction($conn) === false) {
        throw new Exception("Failed to begin transaction");
    }

    // First verify the workout belongs to this creator
    $verifySql = "SELECT workoutID FROM tbl_workout WHERE workoutID = ? AND creatorID = ?";
    $verifyParams = [$data['id'], $data['creatorID']];
    $verifyStmt = sqlsrv_query($conn, $verifySql, $verifyParams);

    if ($verifyStmt === false || !sqlsrv_fetch($verifyStmt)) {
        throw new Exception("Workout not found or you don't have permission to edit it");
    }

    // Update workout details
    $sql = "UPDATE tbl_workout 
            SET workoutName = ?, 
                workoutDesc = ?, 
                workoutLevel = ? 
            WHERE workoutID = ? AND creatorID = ?";
    $params = [
        $data['name'],
        $data['description'],
        $data['difficulty'],
        $data['id'],
        $data['creatorID']
    ];
    
    $stmt = sqlsrv_query($conn, $sql, $params);
    if ($stmt === false) {
        throw new Exception("Failed to update workout");
    }

    // Insert new routines with isActive=1 (for new exercises only)
    foreach ($data['exercises'] as $exercise) {
        // Only insert if this is a new exercise (no routineID)
        if (empty($exercise['routineID'])) {
            if (empty($exercise['name']) || 
                !isset($exercise['sets']) || 
                !isset($exercise['reps'])) {
                throw new Exception("Invalid exercise data");
            }

            $routineSql = "INSERT INTO tbl_routine (workoutID, exerciseName, sets, reps, isActive) 
                           VALUES (?, ?, ?, ?, 1)";
            $routineParams = [
                $data['id'],
                $exercise['name'],
                $exercise['sets'],
                $exercise['reps']
            ];
            
            $routineStmt = sqlsrv_query($conn, $routineSql, $routineParams);
            if ($routineStmt === false) {
                throw new Exception("Failed to insert routine");
            }
        }
    }

    // Commit transaction
    if (sqlsrv_commit($conn) === false) {
        throw new Exception("Failed to commit transaction");
    }

    // Return success response
    echo json_encode([
        "success" => true,
        "message" => "Workout updated successfully"
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && sqlsrv_rollback($conn) === false) {
        die(json_encode([
            "error" => "Failed to rollback transaction",
            "details" => sqlsrv_errors()
        ]));
    }

    die(json_encode([
        "error" => $e->getMessage(),
        "details" => sqlsrv_errors()
    ]));

} finally {
    // Close connection
    if (isset($conn)) {
        sqlsrv_close($conn);
    }
}
?>