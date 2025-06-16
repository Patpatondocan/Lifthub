<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

    // Get the member ID from request
    $memberID = isset($_GET['memberID']) ? $_GET['memberID'] : null;

    if (!$memberID) {
        throw new Exception("memberID parameter is required");
    }
    
    // Query to get workouts
    $sql = "SELECT 
                w.workoutID,
                w.workoutName,
                w.workoutDesc,
                w.workoutLevel,
                w.creatorID,
                w.assignedByID,
                w.assignedToID,
                w.workoutProgress,
                creator.fullName as creatorName,
                assigner.fullName as assignerName
            FROM tbl_workout w
            JOIN tbl_user creator ON w.creatorID = creator.userID
            LEFT JOIN tbl_user assigner ON w.assignedByID = assigner.userID
            WHERE (w.creatorID = ? AND w.assignedToID IS NULL) /* Saved workouts */
               OR w.assignedToID = ? /* Assigned workouts */
            ORDER BY w.workoutName";
    
    $params = array($memberID, $memberID);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }

    $savedWorkouts = array();
    $assignedWorkouts = array();
    
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        // Get exercises from tbl_routine for this workout
        $routinesSql = "SELECT routineID, exerciseName, sets, reps 
                        FROM tbl_routine 
                        WHERE workoutID = ?";
        $routinesParams = array($row['workoutID']);
        $routinesStmt = sqlsrv_query($conn, $routinesSql, $routinesParams);
        
        $exercises = array();
        if ($routinesStmt !== false) {
            while ($exercise = sqlsrv_fetch_array($routinesStmt, SQLSRV_FETCH_ASSOC)) {
                $exercises[] = array(
                    'name' => $exercise['exerciseName'], // Use consistent field name
                    'exerciseName' => $exercise['exerciseName'], // Include original field for compatibility
                    'sets' => intval($exercise['sets']),
                    'reps' => intval($exercise['reps'])
                );
            }
        }

        // Format the workout
        $workout = array(
            "id" => $row['workoutID'],
            "name" => $row['workoutName'],
            "description" => $row['workoutDesc'],
            "difficulty" => $row['workoutLevel'],
            "workoutProgress" => $row['workoutProgress'] ?: "Assigned",
            "creatorID" => $row['creatorID'],
            "assignedByID" => $row['assignedByID'],
            "assignedToID" => $row['assignedToID'],
            "trainerName" => $row['assignedByID'] ? $row['assignerName'] : $row['creatorName'],
            "exercises" => $exercises,
            "completed" => ($row['workoutProgress'] === 'Completed'),
            "inProgress" => ($row['workoutProgress'] === 'In Progress'),
            "hasFeedback" => false,
            "assignedDate" => date('Y-m-d'), // Default if not available
        );

        // Check for feedback
        $feedbackSql = "SELECT feedback FROM tbl_feedback WHERE workoutID = ? AND userID = ?";
        $feedbackParams = array($row['workoutID'], $memberID);
        $feedbackStmt = sqlsrv_query($conn, $feedbackSql, $feedbackParams);
        
        if ($feedbackStmt !== false && sqlsrv_has_rows($feedbackStmt)) {
            $feedbackRow = sqlsrv_fetch_array($feedbackStmt, SQLSRV_FETCH_ASSOC);
            $workout["hasFeedback"] = !empty($feedbackRow['feedback']);
        }

        // Check if this is a saved or assigned workout
        if ($row['assignedToID'] == $memberID) {
            $workout["isAssigned"] = true;
            $workout["isSaved"] = false;
            $assignedWorkouts[] = $workout;
        } else {
            $workout["isAssigned"] = false;
            $workout["isSaved"] = true;
            $savedWorkouts[] = $workout;
        }
    }
    
    echo json_encode([
        "success" => true,
        "savedWorkouts" => $savedWorkouts,
        "assignedWorkouts" => $assignedWorkouts
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
