<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers for CORS and content type - THESE MUST BE FIRST
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Initialize response array
$response = [
    'success' => false,
    'message' => '',
    'members' => []
];

try {
    // SQL Server connection settings
    $serverName = "LAPTOP-ANQIBD69";
    $database = "lifthub";
    $uid = "sa";
    $pass = "admin123";

    // Configure SQL Server connection
    $connectionInfo = [
        "Database" => $database,
        "Uid" => $uid,
        "PWD" => $pass,
        "CharacterSet" => "UTF-8",
        "TrustServerCertificate" => true,
        "LoginTimeout" => 5
    ];

    // Attempt database connection
    $conn = sqlsrv_connect($serverName, $connectionInfo);

    if ($conn === false) {
        throw new Exception("Connection failed: " . print_r(sqlsrv_errors(), true));
    }

    // SQL query to fetch members
    $sql = "SELECT 
                userID, 
                userName, 
                fullName, 
                email, 
                contactNum, 
                userType 
            FROM tbl_user
            ORDER BY fullName ASC";

    $stmt = sqlsrv_query($conn, $sql);

    if ($stmt === false) {
        throw new Exception("Query failed: " . print_r(sqlsrv_errors(), true));
    }

    // Fetch data
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $response['members'][] = [
            'userID' => (int)$row['userID'],
            'userName' => $row['userName'],
            'fullName' => $row['fullName'],
            'email' => $row['email'],
            'contactNum' => formatPhone($row['contactNum']),
            'userType' => $row['userType']
        ];
    }

    $response['success'] = true;
    $response['message'] = count($response['members']) . " members found";

} catch (Exception $e) {
    $response['message'] = "Error: " . $e->getMessage();
    http_response_code(500);
} finally {
    // Clean up resources
    if (isset($stmt)) {
        sqlsrv_free_stmt($stmt);
    }
    if (isset($conn)) {
        sqlsrv_close($conn);
    }
    
    // Ensure output
    echo json_encode($response);
    exit();
}

// Helper function to format phone numbers
function formatPhone($number) {
    $number = preg_replace('/[^0-9]/', '', $number);
    if (strlen($number) === 10) {
        return substr($number, 0, 3) . '-' . substr($number, 3, 3) . '-' . substr($number, 6);
    }
    return $number;
}
?>