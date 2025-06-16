<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

    // Get the request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['userID']) || !isset($data['feedback'])) {
        throw new Exception("userID and feedback are required");
    }

    $userID = $data['userID'];
    $feedback = $data['feedback'];
    $workoutID = isset($data['workoutID']) ? $data['workoutID'] : null; // Optional workoutID

    // Check if this is a general feedback (no workoutID) or workout-specific feedback
    if ($workoutID) {
        // Workout-specific feedback
        
        // Check if feedback already exists for this workout and update it, otherwise insert new
        $checkSql = "SELECT feedbackID FROM tbl_feedback WHERE workoutID = ? AND userID = ?";
        $checkParams = array($workoutID, $userID);
        $checkStmt = sqlsrv_query($conn, $checkSql, $checkParams);

        if ($checkStmt === false) {
            throw new Exception("Failed to check existing feedback: " . print_r(sqlsrv_errors(), true));
        }

        if (sqlsrv_has_rows($checkStmt)) {
            // Update existing feedback
            $row = sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC);
            $feedbackID = $row['feedbackID'];

            $updateSql = "UPDATE tbl_feedback SET feedback = ? WHERE feedbackID = ?";
            $updateParams = array($feedback, $feedbackID);
            $updateStmt = sqlsrv_query($conn, $updateSql, $updateParams);

            if ($updateStmt === false) {
                throw new Exception("Failed to update feedback: " . print_r(sqlsrv_errors(), true));
            }

            echo json_encode([
                "success" => true,
                "message" => "Workout feedback updated successfully"
            ]);
        } else {
            // Insert new workout-specific feedback
            $insertSql = "INSERT INTO tbl_feedback (workoutID, userID, feedback) VALUES (?, ?, ?)";
            $insertParams = array($workoutID, $userID, $feedback);
            $insertStmt = sqlsrv_query($conn, $insertSql, $insertParams);

            if ($insertStmt === false) {
                throw new Exception("Failed to insert feedback: " . print_r(sqlsrv_errors(), true));
            }

            echo json_encode([
                "success" => true,
                "message" => "Workout feedback submitted successfully"
            ]);
        }
    } else {
        // General feedback (null workoutID)
        $insertSql = "INSERT INTO tbl_feedback (userID, feedback, workoutID) VALUES (?, ?, NULL)";
        $insertParams = array($userID, $feedback);
        $insertStmt = sqlsrv_query($conn, $insertSql, $insertParams);

        if ($insertStmt === false) {
            throw new Exception("Failed to insert general feedback: " . print_r(sqlsrv_errors(), true));
        }

        echo json_encode([
            "success" => true,
            "message" => "General feedback submitted successfully"
        ]);
    }
    
} catch (Exception $e) {
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
