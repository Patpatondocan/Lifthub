<?php
// Add detailed error logging for troubleshooting
ini_set('display_errors', 1); // Enable display errors during debugging
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("get_trainers_with_assignments.php called");

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
    
    // Get trainer ID from request if provided (for filtering)
    $trainerID = isset($_GET['trainerID']) ? $_GET['trainerID'] : null;
    
    if ($trainerID) {
        // Get a specific trainer with their assignments
        $trainerSql = "SELECT userID, userName, fullName, email, contactNum 
                       FROM tbl_user
                       WHERE userID = ? AND userType = 'trainer'";
        
        $trainerParams = array($trainerID);
        $trainerStmt = sqlsrv_query($conn, $trainerSql, $trainerParams);
        
        if ($trainerStmt === false) {
            $errors = sqlsrv_errors();
            error_log("Trainer query failed: " . print_r($errors, true));
            throw new Exception("Failed to query trainer: " . $errors[0]['message']);
        }
        
        if (!sqlsrv_has_rows($trainerStmt)) {
            throw new Exception("Trainer not found");
        }
        
        $trainer = sqlsrv_fetch_array($trainerStmt, SQLSRV_FETCH_ASSOC);
        
        // Get all trainees assigned to this trainer
        // Fixed table name from tbl_traineeAssignment to tbl_trainerAssignment
        $traineesSql = "SELECT u.userID, u.userName, u.fullName, u.email, u.contactNum, 
                              FORMAT(ta.assignmentDate, 'yyyy-MM-dd') as assignmentDate
                       FROM tbl_trainerAssignment ta
                       JOIN tbl_user u ON ta.memberID = u.userID
                       WHERE ta.trainerID = ?
                       ORDER BY u.fullName";
        
        $traineesParams = array($trainerID);
        $traineesStmt = sqlsrv_query($conn, $traineesSql, $traineesParams);
        
        if ($traineesStmt === false) {
            $errors = sqlsrv_errors();
            error_log("Trainees query failed: " . print_r($errors, true));
            throw new Exception("Failed to query trainees: " . $errors[0]['message']);
        }
        
        $trainees = array();
        while ($trainee = sqlsrv_fetch_array($traineesStmt, SQLSRV_FETCH_ASSOC)) {
            $trainees[] = $trainee;
        }

        // Get workout count using a simplified query
        $workoutCount = 0;
        
        // Get workouts CREATED by this trainer only (not just assigned)
        $workoutsSql = "SELECT w.workoutID, w.workoutName, w.workoutDesc, w.workoutLevel, 
                             w.assignedToID, u.fullName as assignedToName,
                             w.workoutProgress
                      FROM tbl_workout w
                      LEFT JOIN tbl_user u ON w.assignedToID = u.userID
                      WHERE w.creatorID = ?
                      ORDER BY w.workoutName";
        
        $workoutsParams = array($trainerID);
        $workoutsStmt = sqlsrv_query($conn, $workoutsSql, $workoutsParams);
        
        if ($workoutsStmt === false) {
            $errors = sqlsrv_errors();
            error_log("Workouts query failed: " . print_r($errors, true));
            throw new Exception("Failed to query workouts: " . $errors[0]['message']);
        }
        
        $workouts = array();
        while ($workout = sqlsrv_fetch_array($workoutsStmt, SQLSRV_FETCH_ASSOC)) {
            $workouts[] = $workout;
        }
        
        echo json_encode([
            "success" => true,
            "trainer" => $trainer,
            "trainees" => $trainees,
            "workouts" => $workouts,
            "assignedWorkoutCount" => count($workouts),
            "traineeCount" => count($trainees)
        ]);
    } else {
        // Get all trainers with trainee counts
        $trainersSql = "SELECT u.userID, u.userName, u.fullName, u.email, u.contactNum,
                              COUNT(ta.assignmentID) as traineeCount
                       FROM tbl_user u
                       LEFT JOIN tbl_trainerAssignment ta ON u.userID = ta.trainerID
                       WHERE u.userType = 'trainer'
                       GROUP BY u.userID, u.userName, u.fullName, u.email, u.contactNum
                       ORDER BY u.fullName";
        
        $trainersStmt = sqlsrv_query($conn, $trainersSql);
        
        if ($trainersStmt === false) {
            $errors = sqlsrv_errors();
            error_log("Trainers query failed: " . print_r($errors, true));
            throw new Exception("Failed to query trainers: " . $errors[0]['message']);
        }
        
        $trainers = array();
        while ($trainer = sqlsrv_fetch_array($trainersStmt, SQLSRV_FETCH_ASSOC)) {
            // Get workout count for this trainer (created workouts)
            $workoutsSql = "SELECT COUNT(DISTINCT w.workoutID) as workoutCount
                           FROM tbl_workout w 
                           WHERE w.creatorID = ?";
            $workoutsParams = array($trainer['userID']);
            $workoutsStmt = sqlsrv_query($conn, $workoutsSql, $workoutsParams);
            
            $workoutCount = 0;
            if ($workoutsStmt && sqlsrv_fetch($workoutsStmt)) {
                $workoutCount = sqlsrv_get_field($workoutsStmt, 0);
            }
            
            // Keep the trainee count from the database and add workout count
            $trainer['assignedWorkoutCount'] = $workoutCount;
            $trainers[] = $trainer;
        }
        
        echo json_encode([
            "success" => true,
            "trainers" => $trainers
        ]);
    }
} catch (Exception $e) {
    error_log("Error in get_trainers_with_assignments.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "file" => __FILE__,
        "line" => __LINE__
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>
