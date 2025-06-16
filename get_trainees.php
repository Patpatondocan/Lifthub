<?php
// get_trainees.php - Fixed to actually get trainees instead of workouts
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("get_trainees.php called");

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

    // Get the trainer ID from request
    $trainerID = isset($_GET['trainerID']) ? $_GET['trainerID'] : null;

    if (!$trainerID) {
        throw new Exception("trainerID parameter is required");
    }
    
    error_log("Fetching trainees for trainer ID: " . $trainerID);

    // Query to get trainees assigned to this trainer
    $sql = "SELECT u.userID, u.userName, u.fullName, u.email, u.contactNum, u.userType,
                   FORMAT(a.assignmentDate, 'yyyy-MM-dd') as assignmentDate
            FROM tbl_user u
            JOIN tbl_trainerAssignment a ON u.userID = a.memberID
            WHERE a.trainerID = ? AND u.userType = 'member'
            ORDER BY u.fullName";
    
    $params = array($trainerID);
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }

    $trainees = array();
    
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        // Format the data to match what the frontend expects
        $trainees[] = array(
            "id" => $row['userID'],
            "username" => $row['userName'],
            "name" => $row['fullName'],
            "email" => $row['email'],
            "contactNum" => $row['contactNum'],
            "assignmentDate" => $row['assignmentDate']
        );
    }
    
    error_log("Found " . count($trainees) . " trainees for trainer ID: " . $trainerID);
    
    echo json_encode([
        "success" => true,
        "trainees" => $trainees
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_trainees.php: " . $e->getMessage());
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