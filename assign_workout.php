<?php
// assign_workout.php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("assign_workout.php called");

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

    // Get the raw POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        throw new Exception("Invalid JSON data received");
    }

    // Validate required fields
    if (empty($data['workoutID']) || empty($data['traineeIDs']) || empty($data['assignedByID'])) {
        throw new Exception("Missing required fields (workoutID, traineeIDs, assignedByID)");
    }

    $workoutID = $data['workoutID'];
    $traineeIDs = $data['traineeIDs'];
    $assignedByID = $data['assignedByID'];
    $currentDate = date('Y-m-d H:i:s');

    // Begin transaction
    if (sqlsrv_begin_transaction($conn) === false) {
        throw new Exception("Could not begin transaction");
    }

    // Get the original workout details first
    $getWorkoutSql = "SELECT workoutName, workoutDesc, workoutLevel, creatorID FROM tbl_workout WHERE workoutID = ?";
    $getWorkoutParams = array($workoutID);
    $getWorkoutStmt = sqlsrv_query($conn, $getWorkoutSql, $getWorkoutParams);
    
    if ($getWorkoutStmt === false || !sqlsrv_has_rows($getWorkoutStmt)) {
        throw new Exception("Original workout not found");
    }
    
    $originalWorkout = sqlsrv_fetch_array($getWorkoutStmt, SQLSRV_FETCH_ASSOC);
    
    // Get all exercises for the original workout
    $getExercisesSql = "SELECT exerciseName, sets, reps FROM tbl_routine WHERE workoutID = ?";
    $getExercisesParams = array($workoutID);
    $getExercisesStmt = sqlsrv_query($conn, $getExercisesSql, $getExercisesParams);
    
    if ($getExercisesStmt === false) {
        throw new Exception("Failed to get exercises for the workout");
    }
    
    $exercises = array();
    while ($exercise = sqlsrv_fetch_array($getExercisesStmt, SQLSRV_FETCH_ASSOC)) {
        $exercises[] = $exercise;
    }
    
    if (empty($exercises)) {
        error_log("Warning: No exercises found for original workout ID: $workoutID");
    } else {
        error_log("Found " . count($exercises) . " exercises for original workout");
    }

    $successCount = 0;
    $errors = [];

    foreach ($traineeIDs as $traineeID) {
        // Check if this workout is already assigned to this trainee
        $checkSql = "SELECT COUNT(*) as count FROM tbl_workout 
                    WHERE workoutID = ? AND assignedToID = ?";
        $checkParams = array($workoutID, $traineeID);
        $checkStmt = sqlsrv_query($conn, $checkSql, $checkParams);

        if ($checkStmt === false) {
            $errors[] = "Check query failed for trainee $traineeID: " . print_r(sqlsrv_errors(), true);
            continue;
        }

        $row = sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC);
        if ($row['count'] > 0) {
            $errors[] = "Workout already assigned to trainee $traineeID";
            continue;
        }

        // Create a new workout record for each trainee (copy of original workout)
        $copySql = "INSERT INTO tbl_workout 
                   (workoutName, workoutDesc, workoutLevel, creatorID, assignedByID, assignedToID, workoutProgress)
                   OUTPUT INSERTED.workoutID
                   VALUES (?, ?, ?, ?, ?, ?, 'Assigned')";
        $copyParams = array(
            $originalWorkout['workoutName'],
            $originalWorkout['workoutDesc'],
            $originalWorkout['workoutLevel'],
            $originalWorkout['creatorID'],
            $assignedByID, 
            $traineeID
        );
        $copyStmt = sqlsrv_query($conn, $copySql, $copyParams);

        if ($copyStmt === false) {
            $errors[] = "Insert failed for trainee $traineeID: " . print_r(sqlsrv_errors(), true);
            continue;
        }

        // Get the new workout ID
        if (sqlsrv_fetch($copyStmt) === false) {
            $errors[] = "Failed to get new workout ID for trainee $traineeID";
            continue;
        }
        $newWorkoutID = sqlsrv_get_field($copyStmt, 0);
        
        // Copy all exercises from original workout to new workout
        foreach ($exercises as $exercise) {
            $copyExerciseSql = "INSERT INTO tbl_routine (workoutID, exerciseName, sets, reps) 
                               VALUES (?, ?, ?, ?)";
            $copyExerciseParams = array(
                $newWorkoutID,
                $exercise['exerciseName'],
                $exercise['sets'],
                $exercise['reps']
            );
            $copyExerciseStmt = sqlsrv_query($conn, $copyExerciseSql, $copyExerciseParams);
            
            if ($copyExerciseStmt === false) {
                $errors[] = "Failed to copy exercise for workout $newWorkoutID: " . print_r(sqlsrv_errors(), true);
                // Continue anyway - we want partial exercises rather than none
                continue;
            }
        }

        $successCount++;
    }

    if ($successCount > 0) {
        sqlsrv_commit($conn);
        $response = [
            "success" => true,
            "message" => "Workout assigned to $successCount trainees",
            "errors" => $errors
        ];
    } else {
        sqlsrv_rollback($conn);
        $response = [
            "success" => false,
            "message" => "Failed to assign workout to any trainees",
            "errors" => $errors
        ];
    }

    echo json_encode($response);

} catch (Exception $e) {
    if (isset($conn) && $conn) {
        sqlsrv_rollback($conn);
    }
    error_log("Error in assign_workout.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>