<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
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

// Get and validate request data
$data = json_decode(file_get_contents("php://input"), true);

// Add assignment parameters
$assignedByID = $data['assignedByID'] ?? $data['creatorID'];
$assignedToID = $data['assignedToID'] ?? $data['creatorID']; // Default to self

// Check for required fields
$requiredFields = ['name', 'description', 'difficulty', 'exercises', 'creatorID'];
$missingFields = [];

foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        $missingFields[] = $field;
    }
}

if (!empty($missingFields)) {
    die(json_encode([
        "error" => "Missing required fields",
        "missing" => $missingFields
    ]));
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

try {
    // Begin transaction
    if (sqlsrv_begin_transaction($conn) === false) {
        throw new Exception("Failed to begin transaction");
    }

    // Step 1: Insert the workout 
$workoutSql = "INSERT INTO tbl_workout (
                workoutName, workoutDesc, workoutLevel, 
                creatorID
               ) OUTPUT INSERTED.workoutID 
               VALUES (?, ?, ?, ?)";
$workoutParams = [
    $data['name'],
    $data['description'],
    $data['difficulty'],
    $data['creatorID']
];
    error_log("Inserting workout: " . json_encode($workoutParams));
    
    $workoutStmt = sqlsrv_query($conn, $workoutSql, $workoutParams);
    if ($workoutStmt === false) {
        $errors = sqlsrv_errors();
        error_log("Workout insertion error: " . json_encode($errors));
        throw new Exception("Failed to insert workout: " . $errors[0]['message']);
    }

    // Get the workoutID immediately after insertion
    if (sqlsrv_fetch($workoutStmt) === false) {
        throw new Exception("Failed to fetch workout ID");
    }
    $workoutID = sqlsrv_get_field($workoutStmt, 0);
    
    if (!$workoutID) {
        throw new Exception("Failed to get valid workout ID");
    }

    error_log("Successfully created workout with ID: " . $workoutID);

    // Step 2: Insert the routines using the obtained workoutID
    foreach ($data['exercises'] as $index => $exercise) {
        if (empty($exercise['name']) || 
            !isset($exercise['sets']) || 
            !isset($exercise['reps'])) {
            throw new Exception("Invalid exercise data at position " . ($index + 1));
        }

        $routineSql = "INSERT INTO tbl_routine (workoutID, exerciseName, sets, reps, isActive) 
                       VALUES (?, ?, ?, ?, 1)";
        $routineParams = [
            $workoutID,
            $exercise['name'],
            intval($exercise['sets']),
            intval($exercise['reps'])
        ];
        
        error_log("Inserting routine: " . json_encode($routineParams));
        
        $routineStmt = sqlsrv_query($conn, $routineSql, $routineParams);
        if ($routineStmt === false) {
            $errors = sqlsrv_errors();
            error_log("Routine insertion error: " . json_encode([
                'sql' => $routineSql,
                'params' => $routineParams,
                'error' => $errors
            ]));
            throw new Exception("Failed to insert routine: " . $errors[0]['message']);
        }
    }

    // If we get here, all insertions were successful
    if (sqlsrv_commit($conn) === false) {
        throw new Exception("Failed to commit transaction");
    }

    echo json_encode([
        "success" => true,
        "workoutID" => $workoutID,
        "message" => "Workout and routines created successfully"
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if (sqlsrv_rollback($conn) === false) {
        error_log("Rollback failed: " . json_encode(sqlsrv_errors()));
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
    sqlsrv_close($conn);
}
?>