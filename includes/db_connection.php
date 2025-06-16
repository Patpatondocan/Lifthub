<?php
function getConnection() {
    $host = "localhost";
    $username = "root";  // Replace with your database username
    $password = "";      // Replace with your database password
    $dbname = "lifthub";  // Replace with your database name
    
    $conn = new mysqli($host, $username, $password, $dbname);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    return $conn;
}
?>
