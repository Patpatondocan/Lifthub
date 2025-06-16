<?php
// Add detailed error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("check_trainee_status.php called");

// Allow cross-origin requests
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Direct database connection
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
    
    // Get the posted data
    $data = json_decode(file_get_contents("php://input"));
    error_log("Received data: " . json_encode($data));

    // Validate input
    if (!isset($data->userName) || empty($data->userName)) {
        echo json_encode([
            'success' => false,
            'error' => 'missing_username',
            'message' => 'Username is required'
        ]);
        exit();
    }

    $userName = $data->userName;
    error_log("Checking status for username: " . $userName);

    // Check if user exists
    $checkUserQuery = "SELECT userID FROM tbl_user WHERE userName = ?";
    $checkUserParams = array($userName);
    $checkUserStmt = sqlsrv_query($conn, $checkUserQuery, $checkUserParams);

    if (!$checkUserStmt) {
        error_log("SQL error checking user: " . print_r(sqlsrv_errors(), true));
        throw new Exception("Database error checking user");
    }

    if (sqlsrv_has_rows($checkUserStmt) === false) {
        error_log("User not found: " . $userName);
        echo json_encode([
            'success' => false,
            'error' => 'user_not_found',
            'message' => 'User not found'
        ]);
        exit();
    }

    $userRow = sqlsrv_fetch_array($checkUserStmt, SQLSRV_FETCH_ASSOC);
    $userId = $userRow['userID'];
    error_log("Found userID: " . $userId);

    // Check if user already has a trainer
    $checkTrainerQuery = "
        SELECT ta.trainerID, u.userName, u.fullName as trainerName 
        FROM tbl_trainerAssignment ta
        JOIN tbl_user u ON ta.trainerID = u.userID
        WHERE ta.memberID = ?";

    $checkTrainerParams = array($userId);
    $checkTrainerStmt = sqlsrv_query($conn, $checkTrainerQuery, $checkTrainerParams);

    if (!$checkTrainerStmt) {
        error_log("SQL error checking trainer: " . print_r(sqlsrv_errors(), true));
        throw new Exception("Database error checking trainer assignment");
    }

    if (sqlsrv_has_rows($checkTrainerStmt)) {
        $trainerData = sqlsrv_fetch_array($checkTrainerStmt, SQLSRV_FETCH_ASSOC);
        error_log("User already has trainer: " . json_encode($trainerData));
        
        echo json_encode([
            'success' => false,
            'hasTrainer' => true,
            'trainerName' => $trainerData['trainerName'] ?? $trainerData['userName'],
            'trainerId' => $trainerData['trainerID'],
            'message' => 'User already has a trainer assigned: ' . ($trainerData['trainerName'] ?? $trainerData['userName'])
        ]);
    } else {
        error_log("User does not have an assigned trainer");
        echo json_encode([
            'success' => true,
            'hasTrainer' => false,
            'message' => 'User does not have a trainer assigned'
        ]);
    }

} catch (Exception $e) {
    error_log("Error in check_trainee_status.php: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'error' => 'server_error',
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>
