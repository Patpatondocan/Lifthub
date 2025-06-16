<?php
// get_workouts.php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("get_workouts.php called");

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

    // Get the creator ID from request
    $creatorID = isset($_GET['creatorID']) ? $_GET['creatorID'] : null;

    if (!$creatorID) {
        throw new Exception("creatorID parameter is required");
    }

    // Query to include assigned trainee's name
    $sql = "SELECT w.workoutID, w.workoutName, w.workoutDesc, w.workoutLevel, 
                   w.creatorID, w.assignedByID, w.assignedToID, w.workoutProgress,
                   u.fullName as creatorName,
                   t.fullName as assignedToName
            FROM tbl_workout w
            JOIN tbl_user u ON w.creatorID = u.userID
            LEFT JOIN tbl_user t ON w.assignedToID = t.userID
            WHERE w.creatorID = ? OR w.assignedToID = ?
            ORDER BY w.workoutName";
    
    $params = array($creatorID, $creatorID);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }

    $workouts = array();
    
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        // Get exercises (routines) for this workout from tbl_routine
        $routinesSql = "SELECT routineID, exerciseName as name, sets, reps 
                        FROM tbl_routine 
                        WHERE workoutID = ?";
        $routinesParams = array($row['workoutID']);
        $routinesStmt = sqlsrv_query($conn, $routinesSql, $routinesParams);
        
        $exercises = array();
        if ($routinesStmt !== false) {
            while ($exercise = sqlsrv_fetch_array($routinesStmt, SQLSRV_FETCH_ASSOC)) {
                // Make sure both name and exerciseName fields exist for compatibility
                $exercises[] = array(
                    'name' => $exercise['name'],
                    'exerciseName' => $exercise['name'], // Include both field names
                    'sets' => intval($exercise['sets']),
                    'reps' => intval($exercise['reps'])
                );
            }
        }
        
        $row['exercises'] = $exercises;
        $workouts[] = $row;
    }
    
    echo json_encode($workouts);
    
} catch (Exception $e) {
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