<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers for CORS and content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// SQL Server connection settings
$serverName = "LAPTOP-ANQIBD69"; // Your SQL Server name
$database = "lifthub";
$uid = "sa";
$pass = "admin123";

// Configure SQL Server connection
$connectionInfo = array(
    "Database" => $database,
    "Uid" => $uid,
    "PWD" => $pass,
    "CharacterSet" => "UTF-8",
    "TrustServerCertificate" => true //for SQL Server authentication
);

// Attempt database connection
$conn = sqlsrv_connect($serverName, $connectionInfo);

if ($conn === false) {
    $errors = sqlsrv_errors();
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Connection failed",
        "error" => $errors[0]['message']
    ]);
    exit();
}

// Handle POST request
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        // Read and parse JSON input
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data');
        }
        
        $email = $data['email'];
        $password = $data['password'];

        // Query to check user credentials
        $tsql = "SELECT * FROM tbl_user WHERE email = ? AND password = ?";
        $params = array($email, $password);
        $stmt = sqlsrv_query($conn, $tsql, $params);

        if ($stmt === false) {
            throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
        }

        if (sqlsrv_has_rows($stmt)) {
            $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Login successful",
                "userType" => $row['userType']
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                "success" => false,
                "message" => "Invalid email or password"
            ]);
        }

        sqlsrv_free_stmt($stmt);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }
}

sqlsrv_close($conn);
?>