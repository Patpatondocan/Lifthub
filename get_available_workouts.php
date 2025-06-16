<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Add detailed error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("get_available_workouts.php called");

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

    // Get the user ID from request
    $userID = isset($_GET['userID']) ? $_GET['userID'] : null;

    if (!$userID) {
        throw new Exception("userID parameter is required");
    }

    // Query to get workouts that are not created by or assigned to this user
    $sql = "SELECT 
                w.workoutID,
                w.workoutName,
                w.workoutDesc,
                w.workoutLevel,
                w.creatorID,
                creator.fullName as creatorName
            FROM tbl_workout w
            JOIN tbl_user creator ON w.creatorID = creator.userID
            WHERE w.creatorID != ? 
                AND w.assignedToID IS NULL /* Only workouts without assignment */
                AND w.workoutName NOT LIKE '[DELETED]%'
            ORDER BY w.workoutName";
    
    $params = array($userID, $userID);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }

    $workouts = array();
    
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        // Get exercises from tbl_routine
        $routinesSql = "SELECT routineID, exerciseName as name, sets, reps 
                        FROM tbl_routine 
                        WHERE workoutID = ?";
        $routinesParams = array($row['workoutID']);
        $routinesStmt = sqlsrv_query($conn, $routinesSql, $routinesParams);
        
        if ($routinesStmt === false) {
            error_log("Failed to get routines for workout ID: " . $row['workoutID'] . " - " . print_r(sqlsrv_errors(), true));
            continue;
        }
        
        $exercises = array();
        while ($exercise = sqlsrv_fetch_array($routinesStmt, SQLSRV_FETCH_ASSOC)) {
            // Make sure we use consistent field names
            $exercises[] = array(
                'name' => $exercise['name'], // Using 'name' consistently
                'sets' => intval($exercise['sets']),
                'reps' => intval($exercise['reps'])
            );
        }
        
        error_log("Found " . count($exercises) . " exercises for workout ID: " . $row['workoutID']);
        
        $row['exercises'] = $exercises;
        $workouts[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "workouts" => $workouts
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_available_workouts.php: " . $e->getMessage());
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
