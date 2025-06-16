<?php
// get_workouts_admin.php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("get_workouts_admin.php called");

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
    
    // Get all workouts with creator and assignee names
    $workoutSql = "SELECT 
                    w.workoutID, w.workoutName, w.workoutDesc, w.workoutLevel, 
                    w.creatorID, w.assignedByID, w.assignedToID, w.workoutProgress,
                    creator.fullName as creatorName,
                    assigner.fullName as assignerName,
                    assignee.fullName as assigneeName
                   FROM tbl_workout w
                   LEFT JOIN tbl_user creator ON w.creatorID = creator.userID
                   LEFT JOIN tbl_user assigner ON w.assignedByID = assigner.userID
                   LEFT JOIN tbl_user assignee ON w.assignedToID = assignee.userID
                   ORDER BY w.workoutName";
    
    $workoutStmt = sqlsrv_query($conn, $workoutSql);
    
    if ($workoutStmt === false) {
        throw new Exception("Failed to fetch workouts");
    }
    
    $workouts = array();
    while ($workout = sqlsrv_fetch_array($workoutStmt, SQLSRV_FETCH_ASSOC)) {
        // Add user names to the workout data
        $workouts[] = $workout;
    }
    
    echo json_encode([
        'success' => true,
        'workouts' => $workouts
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>
