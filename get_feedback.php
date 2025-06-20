<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Add detailed error logging for troubleshooting
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("get_feedback.php called");

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

    // Get filter type from request (all, general, workout)
    $filterType = isset($_GET['filter']) ? $_GET['filter'] : 'all';
    error_log("Filter type: " . $filterType);
    
    // Base SQL query with joins to get user, workout, and trainer feedback information
    $sql = "SELECT f.feedbackID, f.feedback, f.workoutID, f.userID, f.trainerID, f.rating, 
                   f.feedbackDate,
                   u.fullName as userName, u.userType,
                   w.workoutName, w.creatorID,
                   creator.fullName as creatorName,
                   creator.userType as creatorType,
                   t.fullName as trainerName
            FROM tbl_feedback f
            JOIN tbl_user u ON f.userID = u.userID
            LEFT JOIN tbl_workout w ON f.workoutID = w.workoutID
            LEFT JOIN tbl_user creator ON w.creatorID = creator.userID
            LEFT JOIN tbl_user t ON f.trainerID = t.userID";
    
    // Apply filter
    if ($filterType === 'general') {
        $sql .= " WHERE f.workoutID IS NULL";
    } else if ($filterType === 'workout') {
        $sql .= " WHERE f.workoutID IS NOT NULL";
    }
    
    $sql .= " ORDER BY f.feedbackID DESC";
    
    $stmt = sqlsrv_query($conn, $sql);

    if ($stmt === false) {
        $errors = sqlsrv_errors();
        error_log("Query failed: " . print_r($errors, true));
        throw new Exception("Query failed: " . $errors[0]['message']);
    }

    $feedback = array();
    
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        error_log("Processing feedback ID: " . $row['feedbackID']);
        $feedbackDate = null;
        if (isset($row['feedbackDate']) && $row['feedbackDate'] instanceof DateTime) {
            $feedbackDate = $row['feedbackDate']->format('c'); // ISO 8601 for JS
        } elseif (isset($row['feedbackDate'])) {
            $feedbackDate = $row['feedbackDate'];
        }
        $feedback[] = array(
            "id" => $row['feedbackID'],
            "text" => $row['feedback'],
            "workoutID" => $row['workoutID'],
            "workoutName" => $row['workoutName'] ?? null,
            "userID" => $row['userID'],
            "userName" => $row['userName'],
            "userType" => $row['userType'],
            "type" => $row['workoutID'] ? "workout" : ($row['trainerID'] ? "trainer" : "general"),
            "creatorID" => $row['creatorID'] ?? null,
            "creatorName" => $row['creatorName'] ?? null,
            "creatorType" => $row['creatorType'] ?? null,
            "trainerID" => $row['trainerID'] ?? null,
            "trainerName" => $row['trainerName'] ?? null,
            "rating" => $row['rating'] ?? null,
            "date" => $feedbackDate
        );
    }
    // Aggregate trainer ratings and feedback counts
    $trainerStats = array();
    foreach ($feedback as $fb) {
        if ($fb['trainerID']) {
            $tid = $fb['trainerID'];
            if (!isset($trainerStats[$tid])) {
                $trainerStats[$tid] = [
                    'trainerID' => $tid,
                    'trainerName' => $fb['trainerName'],
                    'totalRating' => 0,
                    'count' => 0
                ];
            }
            if ($fb['rating']) {
                $trainerStats[$tid]['totalRating'] += intval($fb['rating']);
                $trainerStats[$tid]['count']++;
            }
        }
    }
    foreach ($trainerStats as $tid => $stat) {
        $trainerStats[$tid]['averageRating'] = $stat['count'] > 0 ? round($stat['totalRating'] / $stat['count'], 2) : null;
    }
    error_log("Total feedback items: " . count($feedback));
    echo json_encode([
        "success" => true,
        "feedback" => $feedback,
        "trainerStats" => array_values($trainerStats)
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_feedback.php: " . $e->getMessage());
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
