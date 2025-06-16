<?php
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

    // Get the request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['workoutID']) || !isset($data['memberID'])) {
        throw new Exception("workoutID and memberID are required");
    }

    $workoutID = $data['workoutID'];
    $memberID = $data['memberID'];
    $action = isset($data['action']) ? $data['action'] : 'save'; // 'save' or 'unsave'

    // Begin transaction
    if (sqlsrv_begin_transaction($conn) === false) {
        throw new Exception("Could not begin transaction");
    }

    // First check if this workout is already saved by this member (check if there's a workout with this member as creator)
    $checkSql = "SELECT workoutID FROM tbl_workout WHERE workoutID = ? AND creatorID = ?";
    $checkParams = array($workoutID, $memberID);
    $checkStmt = sqlsrv_query($conn, $checkSql, $checkParams);

    if ($checkStmt === false) {
        throw new Exception("Failed to check saved workout: " . print_r(sqlsrv_errors(), true));
    }

    $alreadySaved = sqlsrv_has_rows($checkStmt);

    if ($action === 'save' && !$alreadySaved) {
        // Get the workout details
        $getWorkoutSql = "SELECT workoutName, workoutDesc, workoutLevel FROM tbl_workout WHERE workoutID = ?";
        $getWorkoutParams = array($workoutID);
        $getWorkoutStmt = sqlsrv_query($conn, $getWorkoutSql, $getWorkoutParams);

        if ($getWorkoutStmt === false || !sqlsrv_has_rows($getWorkoutStmt)) {
            throw new Exception("Workout not found");
        }

        $workoutDetails = sqlsrv_fetch_array($getWorkoutStmt, SQLSRV_FETCH_ASSOC);

        // Create a copy of the workout for the member
        $saveSql = "INSERT INTO tbl_workout (workoutName, workoutDesc, workoutLevel, creatorID) 
                    OUTPUT INSERTED.workoutID
                    VALUES (?, ?, ?, ?)";
        $saveParams = array(
            $workoutDetails['workoutName'],
            $workoutDetails['workoutDesc'],
            $workoutDetails['workoutLevel'],
            $memberID
        );

        $saveStmt = sqlsrv_query($conn, $saveSql, $saveParams);

        if ($saveStmt === false) {
            throw new Exception("Failed to save workout: " . print_r(sqlsrv_errors(), true));
        }

        // Get the ID of the newly saved workout
        if (sqlsrv_fetch($saveStmt) === false) {
            throw new Exception("Could not get the ID of the saved workout");
        }

        $newWorkoutID = sqlsrv_get_field($saveStmt, 0);

        // Now copy the routines (exercises) from the original workout
        $getRoutinesSql = "SELECT exerciseName, sets, reps FROM tbl_routine WHERE workoutID = ?";
        $getRoutinesParams = array($workoutID);
        $getRoutinesStmt = sqlsrv_query($conn, $getRoutinesSql, $getRoutinesParams);

        if ($getRoutinesStmt === false) {
            throw new Exception("Failed to get workout exercises: " . print_r(sqlsrv_errors(), true));
        }

        while ($routine = sqlsrv_fetch_array($getRoutinesStmt, SQLSRV_FETCH_ASSOC)) {
            $saveRoutineSql = "INSERT INTO tbl_routine (workoutID, exerciseName, sets, reps) 
                              VALUES (?, ?, ?, ?)";
            $saveRoutineParams = array(
                $newWorkoutID,
                $routine['exerciseName'],
                $routine['sets'],
                $routine['reps']
            );
            
            $saveRoutineStmt = sqlsrv_query($conn, $saveRoutineSql, $saveRoutineParams);
            
            if ($saveRoutineStmt === false) {
                throw new Exception("Failed to save workout exercises: " . print_r(sqlsrv_errors(), true));
            }
        }

        echo json_encode([
            "success" => true,
            "message" => "Workout saved successfully"
        ]);
    } elseif ($action === 'unsave' && $alreadySaved) {
        // First delete the routines associated with this workout
        $deleteRoutinesSql = "DELETE FROM tbl_routine WHERE workoutID = ?";
        $deleteRoutinesParams = array($workoutID);
        $deleteRoutinesStmt = sqlsrv_query($conn, $deleteRoutinesSql, $deleteRoutinesParams);

        if ($deleteRoutinesStmt === false) {
            throw new Exception("Failed to delete workout exercises: " . print_r(sqlsrv_errors(), true));
        }

        // Then delete the workout itself
        $deleteWorkoutSql = "DELETE FROM tbl_workout WHERE workoutID = ? AND creatorID = ?";
        $deleteWorkoutParams = array($workoutID, $memberID);
        $deleteWorkoutStmt = sqlsrv_query($conn, $deleteWorkoutSql, $deleteWorkoutParams);

        if ($deleteWorkoutStmt === false) {
            throw new Exception("Failed to delete workout: " . print_r(sqlsrv_errors(), true));
        }

        echo json_encode([
            "success" => true,
            "message" => "Workout removed from saved workouts"
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "message" => $alreadySaved ? "Workout already saved" : "Workout not saved"
        ]);
    }
    
    // Commit transaction
    if (sqlsrv_commit($conn) === false) {
        throw new Exception("Failed to commit transaction: " . print_r(sqlsrv_errors(), true));
    }
    
} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn) && sqlsrv_rollback($conn) === false) {
        $rollbackError = "Failed to rollback transaction: " . print_r(sqlsrv_errors(), true);
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "rollbackError" => isset($rollbackError) ? $rollbackError : null
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>
