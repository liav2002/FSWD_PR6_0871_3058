const express = require('express');
const router = express.Router();

// Utility function to send a consistent JSON response
function sendResponse(res, status, message, data = null) {
    const response = { message };

    if (data !== null) {
        response.data = data;
    }

    res.status(status).json(response);
}

module.exports = (connection) => {

    // Route to retrieve messages between the current user and the selected user
    router.get('/messagesWithCurrentUser', (req, res) => {
        console.log("SERVER-DEBUG: router '/messagesWithCurrentUser' handler.");

        const currentId = req.query.currentId;
        const selectedUserId = req.query.selectedUserId;

        console.log("SERVER-DEBUG: current_user_id <- " + currentId);
        console.log("SERVER-DEBUG: selected_user_id <- " + selectedUserId);

        // Validate that the currentId and selectedUserId are provided and are positive integers
        if (!currentId || isNaN(currentId) || parseInt(currentId) <= 0 || !Number.isInteger(Number(currentId))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentId' is required and must be a positive integer.");
        }

        if (!selectedUserId || isNaN(selectedUserId) || parseInt(selectedUserId) <= 0 || !Number.isInteger(Number(selectedUserId))) {
            console.error("SERVER-ERROR: Invalid or missing 'selectedUserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'selectedUserId' is required and must be a positive integer.");
        }

        // SQL query to retrieve all messages between the current user and the selected user
        const query = `
            SELECT * FROM messages 
            WHERE (isItGroup = ?) 
            AND ((sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)) 
            ORDER BY date ASC, hour ASC;
        `;

        connection.query(query, [0, parseInt(currentId), parseInt(selectedUserId), parseInt(selectedUserId), parseInt(currentId)], (err, rows) => {
            if (err) {
                console.error("SERVER-ERROR: Failed executing the query:", err);
                return sendResponse(res, 500, "Error retrieving messages.");
            }

            if (rows.length === 0) {
                console.log("SERVER-DEBUG: No messages found between the users.");
                return sendResponse(res, 404, "No messages found between the users.");
            }

            console.log("SERVER-DEBUG: Messages retrieved successfully:", rows);
            return sendResponse(res, 200, "Messages retrieved successfully", rows);
        });
    });

    return router;
};