<?php
/**
 * Logs staff activities to the tbl_logs table
 * 
 * @param mysqli|resource $conn - Database connection
 * @param int $staffID - ID of the staff member performing the action
 * @param string $action - Type of action being performed
 * @param string $details - Additional information about the action
 * @return bool - True on success, false on failure
 */
function logStaffActivity($conn, $staffID, $action, $details) {
    // Verify this is a staff action by checking user type
    $checkStaffSql = "SELECT userType FROM tbl_user WHERE userID = ?";
    $checkStaffParams = array($staffID);
    $checkStaffStmt = sqlsrv_query($conn, $checkStaffSql, $checkStaffParams);
    
    if ($checkStaffStmt === false || !sqlsrv_has_rows($checkStaffStmt)) {
        return false; // User not found
    }
    
    $row = sqlsrv_fetch_array($checkStaffStmt, SQLSRV_FETCH_ASSOC);
    
    // Only log if the user is staff or admin
    if ($row['userType'] !== 'staff' && $row['userType'] !== 'admin') {
        return false;
    }
    
    // Get staff name for more detailed logging
    $getStaffNameSql = "SELECT fullName FROM tbl_user WHERE userID = ?";
    $getStaffNameParams = array($staffID);
    $getStaffNameStmt = sqlsrv_query($conn, $getStaffNameSql, $getStaffNameParams);
    
    $staffName = "Unknown Staff";
    if ($getStaffNameStmt !== false && sqlsrv_has_rows($getStaffNameStmt)) {
        $nameRow = sqlsrv_fetch_array($getStaffNameStmt, SQLSRV_FETCH_ASSOC);
        $staffName = $nameRow['fullName'];
    }
    
    // Insert into logs table
    $logSql = "INSERT INTO tbl_logs (userID, logDateTime, logAction, logInfo) VALUES (?, GETDATE(), ?, ?)";
    $logInfo = $staffName . " " . $details;
    $logParams = array($staffID, $action, $logInfo);
    
    $logStmt = sqlsrv_query($conn, $logSql, $logParams);
    
    return ($logStmt !== false);
}

/**
 * Utility function for consistent activity logging
 *
 * @param object $conn - SQL Server connection
 * @param int $staffID - ID of the staff member performing the action
 * @param string $action - Short description of the action (e.g., "Added Member")
 * @param string $detailedInfo - Detailed information about the action
 * @return bool - Whether logging was successful
 */
function logActivity($conn, $staffID, $action, $detailedInfo) {
    // Get the staff name
    $staffNameSql = "SELECT fullName FROM tbl_user WHERE userID = ?";
    $staffNameParams = array($staffID);
    $staffNameStmt = sqlsrv_query($conn, $staffNameSql, $staffNameParams);

    $staffName = "Unknown Staff";
    if ($staffNameStmt !== false && sqlsrv_has_rows($staffNameStmt)) {
        $staffRow = sqlsrv_fetch_array($staffNameStmt, SQLSRV_FETCH_ASSOC);
        $staffName = $staffRow['fullName'];
    }

    // Format log info to include staff name
    $logInfo = "$staffName $detailedInfo";
    
    // Insert log entry
    $logSql = "INSERT INTO tbl_logs (userID, logDateTime, logAction, logInfo) VALUES (?, GETDATE(), ?, ?)";
    $logParams = array($staffID, $action, $logInfo);
    $logStmt = sqlsrv_query($conn, $logSql, $logParams);
    
    if ($logStmt === false) {
        error_log("Failed to log activity: " . print_r(sqlsrv_errors(), true));
        return false;
    }
    
    return true;
}
?>
