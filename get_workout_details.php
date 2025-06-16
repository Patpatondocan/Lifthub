<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Error logging setup
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("get_workout_details.php called");

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
    
    // Get workout ID from request
    if (!isset($_GET['workoutID']) || !is_numeric($_GET['workoutID'])) {
        throw new Exception("Invalid workout ID");
    }
    
    $workoutID = $_GET['workoutID'];
    error_log("Fetching details for workout ID: " . $workoutID);
    
    // Get workout details with creator and assignee information
    $workoutSql = "SELECT 
                    w.workoutID, 
                    w.workoutName, 
                    w.workoutDesc, 
                    w.workoutLevel, 
                    w.creatorID, 
                    w.assignedByID, 
                    w.assignedToID, 
                    w.workoutProgress,
                    creator.userName as creatorUserName,
                    creator.fullName as creatorFullName,
                    creator.email as creatorEmail,
                    creator.contactNum as creatorContact,
                    creator.userType as creatorUserType,
                    assigner.userName as assignerUserName,
                    assigner.fullName as assignerFullName,
                    assigner.email as assignerEmail,
                    assigner.contactNum as assignerContact,
                    assignee.userName as assigneeUserName,
                    assignee.fullName as assigneeFullName,
                    assignee.email as assigneeEmail,
                    assignee.contactNum as assigneeContact,
                    assignee.membership as assigneeMembership
                FROM tbl_workout w
                LEFT JOIN tbl_user creator ON w.creatorID = creator.userID
                LEFT JOIN tbl_user assigner ON w.assignedByID = assigner.userID
                LEFT JOIN tbl_user assignee ON w.assignedToID = assignee.userID
                WHERE w.workoutID = ?";
                
    $workoutParams = array($workoutID);
    $workoutStmt = sqlsrv_query($conn, $workoutSql, $workoutParams);
    
    if ($workoutStmt === false || !sqlsrv_has_rows($workoutStmt)) {
        throw new Exception("Workout not found");
    }
    
    $workout = sqlsrv_fetch_array($workoutStmt, SQLSRV_FETCH_ASSOC);
    
    // Format membership date if it exists
    if (isset($workout['assigneeMembership']) && $workout['assigneeMembership'] !== null) {
        if ($workout['assigneeMembership'] instanceof DateTime) {
            $workout['assigneeMembership'] = $workout['assigneeMembership']->format('Y-m-d');
        }
    }
    
    // Get workout exercises based on your tbl_routine schema
    $exercisesSql = "SELECT routineID, exerciseName, sets, reps
                     FROM tbl_routine
                     WHERE workoutID = ?
                     ORDER BY routineID";
    
    $exercisesParams = array($workoutID);
    $exercisesStmt = sqlsrv_query($conn, $exercisesSql, $exercisesParams);
    
    if ($exercisesStmt === false) {
        throw new Exception("Failed to fetch exercises");
    }
    
    $exercises = array();
    while ($exercise = sqlsrv_fetch_array($exercisesStmt, SQLSRV_FETCH_ASSOC)) {
        $exercises[] = array(
            'id' => $exercise['routineID'],
            'name' => $exercise['exerciseName'],
            'exerciseName' => $exercise['exerciseName'],
            'sets' => intval($exercise['sets']),
            'reps' => intval($exercise['reps'])
        );
    }
    
    // Structure the response data to include creator, assigner, and assignee information
    $response = [
        'success' => true,
        'workout' => [
            'id' => $workout['workoutID'],
            'name' => $workout['workoutName'],
            'description' => $workout['workoutDesc'],
            'difficulty' => $workout['workoutLevel'],
            'progress' => $workout['workoutProgress'],
        ],
        'creator' => [
            'id' => $workout['creatorID'],
            'userName' => $workout['creatorUserName'],
            'fullName' => $workout['creatorFullName'],
            'email' => $workout['creatorEmail'],
            'contact' => $workout['creatorContact'],
            'userType' => $workout['creatorUserType']
        ],
        'exercises' => $exercises
    ];
    
    // Add assigner info if available
    if (!empty($workout['assignedByID'])) {
        $response['assigner'] = [
            'id' => $workout['assignedByID'],
            'userName' => $workout['assignerUserName'],
            'fullName' => $workout['assignerFullName'],
            'email' => $workout['assignerEmail'],
            'contact' => $workout['assignerContact']
        ];
    }
    
    // Add assignee info if available
    if (!empty($workout['assignedToID'])) {
        $response['assignee'] = [
            'id' => $workout['assignedToID'],
            'userName' => $workout['assigneeUserName'],
            'fullName' => $workout['assigneeFullName'],
            'email' => $workout['assigneeEmail'],
            'contact' => $workout['assigneeContact'],
            'membership' => isset($workout['assigneeMembership']) ? $workout['assigneeMembership'] : null
        ];
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("Error in get_workout_details.php: " . $e->getMessage());
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
