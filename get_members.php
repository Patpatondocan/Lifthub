<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => '', 'members' => []];

try {
    $serverName = "LAPTOP-ANQIBD69";
    $connectionInfo = [
        "Database" => "lifthub",
        "Uid" => "sa",
        "PWD" => "admin123",
        "CharacterSet" => "UTF-8",
        "TrustServerCertificate" => true
    ];

    $conn = sqlsrv_connect($serverName, $connectionInfo);
    if ($conn === false) {
        throw new Exception("Connection failed: " . json_encode(sqlsrv_errors()));
    }

    $sql = "SELECT 
                userID, 
                userName, 
                fullName,  
                email, 
                contactNum, 
                userType,
                CONVERT(varchar, membership, 120) as membership
            FROM tbl_user 
            WHERE userType != 'admin'
            ORDER BY fullName ASC";

    $stmt = sqlsrv_query($conn, $sql);
    if ($stmt === false) {
        throw new Exception("Query failed: " . json_encode(sqlsrv_errors()));
    }

    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $response['members'][] = [
            'userID' => (int)$row['userID'],
            'userName' => $row['userName'],
            'name' => $row['fullName'],      // Include name field for UI compatibility
            'fullName' => $row['fullName'],  // Include fullName field for consistency
            'email' => $row['email'],
            'contactNum' => $row['contactNum'],
            'userType' => $row['userType'],
            'membership' => $row['membership']  // ISO formatted date string
        ];
    }

    $response['success'] = true;
    $response['message'] = count($response['members']) . " members loaded";

} catch (Exception $e) {
    $response['message'] = "Error: " . $e->getMessage();
    http_response_code(500);
} finally {
    if (isset($stmt)) sqlsrv_free_stmt($stmt);
    if (isset($conn)) sqlsrv_close($conn);
    
    ob_clean();
    echo json_encode($response);
    exit();
}
?>