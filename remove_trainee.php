<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization");

// Add detailed error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/LiftHub/php_errors.log');
error_log("remove_trainee.php called");

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

    // Parse request body
    $data = json_decode(file_get_contents('php://input'), true);
    error_log("Received data: " . json_encode($data));

    if (!isset($data['trainerID']) || !isset($data['traineeID'])) {
        throw new Exception("Missing required parameters (trainerID and traineeID)");
    }

    $trainerID = $data['trainerID'];
    $traineeID = $data['traineeID'];
    
    error_log("Removing trainee ID {$traineeID} from trainer ID {$trainerID}");

    // Delete from tbl_trainerAssignment
    $deleteSql = "DELETE FROM tbl_trainerAssignment 
                 WHERE trainerID = ? AND memberID = ?";
    
    $deleteParams = array($trainerID, $traineeID);
    $deleteStmt = sqlsrv_query($conn, $deleteSql, $deleteParams);
    
    if ($deleteStmt === false) {
        $errors = sqlsrv_errors();
        error_log("SQL Error: " . print_r($errors, true));
        throw new Exception("Failed to remove trainer assignment: " . $errors[0]['message']);
    }
    
    // Check if any rows were affected
    $rowsAffected = sqlsrv_rows_affected($deleteStmt);
    if ($rowsAffected === 0) {
        error_log("No assignments found to delete");
        echo json_encode([
            "success" => false,
            "message" => "No trainer-trainee relationship found to remove"
        ]);
        exit;
    }
    
    error_log("Trainee removal successful. Rows affected: $rowsAffected");

    echo json_encode([
        "success" => true,
        "message" => "Trainee removed successfully"
    ]);
    
} catch (Exception $e) {
    error_log("Error in remove_trainee.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn) {
        sqlsrv_close($conn);
    }
}
?>
