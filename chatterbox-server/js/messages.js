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

    // Route to retrieve all messages sent in a specific group
    router.get('/messagesWithCurrentGroup', (req, res) => {
        console.log("SERVER-DEBUG: router '/messagesWithCurrentGroup' handler.");

        const groupId = req.query.groupId;

        console.log("SERVER-DEBUG: group_id <- " + groupId);

        // Validate that groupId is provided and is a positive integer
        if (!groupId || isNaN(groupId) || parseInt(groupId) <= 0 || !Number.isInteger(Number(groupId))) {
            console.error("SERVER-ERROR: Invalid or missing 'groupId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'groupId' is required and must be a positive integer.");
        }

        // SQL query to retrieve all messages sent in the group
        const query = `
            SELECT * FROM messages 
            WHERE (receiver = ?) AND (isItGroup = true) 
            ORDER BY date ASC, hour ASC;
        `;

        connection.query(query, [parseInt(groupId)], (err, rows) => {
            if (err) {
                console.error("SERVER-ERROR: Failed executing the query:", err);
                return sendResponse(res, 500, "Error retrieving messages.");
            }

            if (rows.length === 0) {
                console.log("SERVER-DEBUG: No messages found in the group.");
                return sendResponse(res, 404, "No messages found in the group.");
            }

            console.log("SERVER-DEBUG: Messages retrieved successfully:", rows);
            return sendResponse(res, 200, "Messages retrieved successfully", rows);
        });
    });

    // Route to add a new message
    router.post('/addMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/addMessage' handler.");

        // Check if the Content-Type is application/json
        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        const newMsg = req.body; // Extract the new message data from the request body

        console.log("SERVER-DEBUG: request body:");
        console.log("SERVER-DEBUG: message details:", newMsg);

        // Validate required parameters
        const requiredFields = ['sender', 'receiver', 'text', 'date', 'hour', 'isItGroup'];
        for (let field of requiredFields) {
            if (newMsg[field] === undefined) {
                console.error(`SERVER-ERROR: Missing required parameter '${field}'.`);
                return sendResponse(res, 400, `Bad Request: '${field}' is required.`);
            }
        }

        // Validate sender and receiver are positive integers
        if (isNaN(newMsg.sender) || parseInt(newMsg.sender) <= 0 || !Number.isInteger(Number(newMsg.sender))) {
            console.error("SERVER-ERROR: Invalid 'sender'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'sender' must be a positive integer.");
        }

        if (isNaN(newMsg.receiver) || parseInt(newMsg.receiver) <= 0 || !Number.isInteger(Number(newMsg.receiver))) {
            console.error("SERVER-ERROR: Invalid 'receiver'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'receiver' must be a positive integer.");
        }

        // SQL query to insert the new message into the 'messages' table
        const insertQuery = 'INSERT INTO messages SET ?';
        // SQL query to retrieve the newly inserted message details
        const selectQuery = 'SELECT * FROM messages WHERE id = ?';

        connection.query(insertQuery, [newMsg], (err, results) => {
            if (err) {
                // If an error occurs during query execution, log the error and send a response with an error message
                console.error('SERVER-ERROR: Error executing query:', err);
                return sendResponse(res, 500, 'An error occurred while adding the new message.');
            }

            const newMsgId = results.insertId; // Get the ID of the newly inserted message

            connection.query(selectQuery, [newMsgId], (err, results1) => {
                if (err) {
                    console.error('SERVER-ERROR: Error executing query:', err);
                    return sendResponse(res, 500, 'An error occurred while retrieving the newly added message.');
                }

                const newMessage = results1[0]; // Retrieve the newly inserted message details
                console.log("SERVER-DEBUG: New message successfully added:", newMessage);

                // Send the new message as a response
                return sendResponse(res, 200, "Message added successfully", newMessage);
            });
        });
    });

    return router;
};