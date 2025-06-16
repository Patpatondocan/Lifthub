<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Enable detailed logging for debugging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("get_assigned_workouts.php called");

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
    error_log("Member ID: " . $memberID);

    if (!$memberID) {
        throw new Exception("memberID parameter is required");
    }
    
    // Query to get ASSIGNED workouts only
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
            WHERE w.assignedToID = ? /* Only assigned workouts */
            ORDER BY w.workoutName";
    
    $params = array($memberID);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }

    $assignedWorkouts = array();
    
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        // Log the workout we're processing
        error_log("Processing assigned workout ID: " . $row['workoutID']);
        
        // Get exercises from tbl_routine - explicitly specify the columns
        $routinesSql = "SELECT routineID, exerciseName, sets, reps 
                     FROM tbl_routine 
                     WHERE workoutID = ?";
        $routinesParams = array($row['workoutID']);
        $routinesStmt = sqlsrv_query($conn, $routinesSql, $routinesParams);
        
        if ($routinesStmt === false) {
            error_log("Failed to query routines: " . print_r(sqlsrv_errors(), true));
        }
        
        $exercises = array();
        if ($routinesStmt !== false) {
            while ($exercise = sqlsrv_fetch_array($routinesStmt, SQLSRV_FETCH_ASSOC)) {
                error_log("Found exercise: " . $exercise['exerciseName']);
                $exercises[] = array(
                    'name' => $exercise['exerciseName'], // Corrected - use exerciseName as in the SQL query
                    'sets' => intval($exercise['sets']),
                    'reps' => intval($exercise['reps'])
                );
            }
        }
        
        error_log("Total exercises found for workoutID " . $row['workoutID'] . ": " . count($exercises));

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
            "isAssigned" => true,
            "isSaved" => false,
            "assignedDate" => date('Y-m-d'), // Default if not available
        );

        // Check for feedback
        $feedbackSql = "SELECT feedback FROM tbl_feedback WHERE workoutID = ? AND userID = ?";
        $feedbackParams = array($row['workoutID'], $memberID);
        $feedbackStmt = sqlsrv_query($conn, $feedbackSql, $feedbackParams);
        
        if ($feedbackStmt !== false && sqlsrv_has_rows($feedbackStmt)) {
            $feedbackRow = sqlsrv_fetch_array($feedbackStmt, SQLSRV_FETCH_ASSOC);
            $workout["hasFeedback"] = !empty($feedbackRow['feedback']);
            // Include the actual feedback content
            $workout["feedbackContent"] = $feedbackRow['feedback'];
        }

        $assignedWorkouts[] = $workout;
    }
    
    error_log("Total assigned workouts: " . count($assignedWorkouts));
    echo json_encode([
        "success" => true,
        "assignedWorkouts" => $assignedWorkouts
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_assigned_workouts.php: " . $e->getMessage());
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
