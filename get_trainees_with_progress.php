<?php
// get_trainees_with_progress.php
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("get_trainees_with_progress.php called");

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check for trainerID or creatorID parameter (accept either one)
if (isset($_GET['trainerID'])) {
    $trainerID = $_GET['trainerID'];
} elseif (isset($_GET['creatorID'])) {
    $trainerID = $_GET['creatorID'];
} else {
    http_response_code(400);
    echo json_encode(["error" => "Missing trainerID or creatorID parameter"]);
    exit();
}

error_log("Trainer ID: " . $trainerID);

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
    error_log("Attempting to connect to database");
    $conn = sqlsrv_connect($serverName, $connectionInfo);

    if ($conn === false) {
        $errors = print_r(sqlsrv_errors(), true);
        error_log("Connection failed: $errors");
        throw new Exception("Connection failed: " . $errors);
    }
    
    error_log("Database connection successful");

    // Query to get trainees assigned to this trainer (using tbl_trainerAssignment)
    $traineesQuery = "SELECT 
                        u.userID as id, 
                        u.userName as username, 
                        u.fullName as name,
                        u.email,
                        u.contactNum as phone
                      FROM 
                        tbl_user u
                      INNER JOIN 
                        tbl_trainerAssignment ta ON u.userID = ta.memberID
                      WHERE 
                        ta.trainerID = ?";
    
    error_log("Executing trainees query: $traineesQuery with ID: $trainerID");
    $params = array($trainerID);
    $traineesStmt = sqlsrv_query($conn, $traineesQuery, $params);

    if ($traineesStmt === false) {
        $errors = print_r(sqlsrv_errors(), true);
        error_log("Trainees query failed: $errors");
        throw new Exception("Trainees query failed: " . $errors);
    }

    $trainees = array();
    
    while ($trainee = sqlsrv_fetch_array($traineesStmt, SQLSRV_FETCH_ASSOC)) {
        // For each trainee, get their assigned workouts from tbl_workout
        $workoutsQuery = "SELECT 
                            w.workoutID,
                            w.workoutName as name,
                            w.workoutProgress as progress
                          FROM 
                            tbl_workout w
                          WHERE 
                            w.assignedToID = ?";
        
        $workoutParams = array($trainee['id']);
        $workoutsStmt = sqlsrv_query($conn, $workoutsQuery, $workoutParams);
        
        if ($workoutsStmt === false) {
            $errors = print_r(sqlsrv_errors(), true);
            error_log("Workouts query failed for trainee {$trainee['id']}: $errors");
            $trainee['workouts'] = []; // Skip if error
        } else {
            $workouts = array();
            while ($workout = sqlsrv_fetch_array($workoutsStmt, SQLSRV_FETCH_ASSOC)) {
                // Get feedback for this workout if exists
                $feedbackQuery = "SELECT feedback FROM tbl_feedback 
                                 WHERE workoutID = ? AND userID = ?";
                $feedbackParams = array($workout['workoutID'], $trainee['id']);
                $feedbackStmt = sqlsrv_query($conn, $feedbackQuery, $feedbackParams);
                
                $feedback = null;
                if ($feedbackStmt !== false) {
                    $feedbackRow = sqlsrv_fetch_array($feedbackStmt, SQLSRV_FETCH_ASSOC);
                    $feedback = $feedbackRow ? $feedbackRow['feedback'] : null;
                }
                
                $workouts[] = array(
                    'name' => $workout['name'],
                    'completed' => ($workout['progress'] === 'Completed'),
                    'hasFeedback' => !empty($feedback),
                    'feedback' => $feedback
                );
            }
            $trainee['workouts'] = $workouts;
        }
        
        // Calculate progress percentage
        $totalWorkouts = count($trainee['workouts']);
        $completedWorkouts = count(array_filter($trainee['workouts'], function($w) {
            return $w['completed'];
        }));
        $trainee['progress'] = ($totalWorkouts > 0) ? round(($completedWorkouts / $totalWorkouts) * 100) : 0;
        
        $trainees[] = $trainee;
    }
    
    error_log("Successfully fetched " . count($trainees) . " trainees");
    echo json_encode($trainees);
    
} catch (Exception $e) {
    error_log("Error in get_trainees_with_progress.php: " . $e->getMessage());
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