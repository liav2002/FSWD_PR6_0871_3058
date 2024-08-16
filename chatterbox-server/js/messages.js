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

    // Route to update a message's text, date, and hour
    router.put('/updateMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/updateMessage' handler.");

        // Check if the Content-Type is application/json
        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        // Extract message details from the request body
        const msgId = req.query.id;
        const msg = req.body; 
        const msgText = msg.text;
        const date = msg.date;
        const hour = msg.hour;

        // Log the extracted parameters
        console.log("SERVER-DEBUG: Request parameters and body:");
        console.log("SERVER-DEBUG: msg_id <- " + msgId);
        console.log("SERVER-DEBUG: msg_text <- " + msgText);
        console.log("SERVER-DEBUG: msg_date <- " + date);
        console.log("SERVER-DEBUG: msg_hour <- " + hour);

        // Validate that the msgId is provided and is a positive integer
        if (!msgId || isNaN(msgId) || parseInt(msgId) <= 0 || !Number.isInteger(Number(msgId))) {
            console.error("SERVER-ERROR: Invalid or missing 'id'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'id' is required and must be a positive integer.");
        }

        // Validate required fields in the body
        if (!msgText || !date || !hour) {
            console.error("SERVER-ERROR: Missing required fields 'text', 'date', or 'hour'.");
            return sendResponse(res, 400, "Bad Request: 'text', 'date', and 'hour' are required.");
        }

        // Define the SQL query to update the message's text, date, and hour
        const query = `UPDATE messages SET text = ?, date = ?, hour = ? WHERE id = ?`;

        // Execute the SQL query with the message details and id
        connection.query(query, [msgText, date, hour, parseInt(msgId)], (error, results) => {
            if (error) {
                console.error("SERVER-ERROR: Error executing the query:", error);
                return sendResponse(res, 500, "An error occurred while updating the message.");
            }

            // Check if the update query affected any rows in the database
            if (results.affectedRows === 0) {
                return sendResponse(res, 404, "Message not found.");
            }

            // Log successful update
            console.log("SERVER-DEBUG: Message updated successfully.");

            // If the update was successful, send a response with the updated text
            return sendResponse(res, 200, "Message updated successfully", {
                id: msgId,
                text: msgText,
                date: date,
                hour: hour
            });
        });
    });

    // Route to delete a message by ID
    router.delete('/deleteMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/deleteMessage' handler.");

        // Extract the msgId from the query parameters
        let msgId = req.query.id;

        // Log the extracted parameter
        console.log("SERVER-DEBUG: msg_id <- " + msgId);

        // Validate that the msgId is provided and is a positive integer
        if (!msgId || isNaN(msgId) || parseInt(msgId) <= 0 || !Number.isInteger(Number(msgId))) {
            console.error("SERVER-ERROR: Invalid or missing 'id'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'id' is required and must be a positive integer.");
        }

        // Define the SQL query to delete a message with the given id
        const query = `DELETE FROM messages WHERE id = ?`;

        // Execute the SQL query with the msgId as a parameter
        connection.query(query, [parseInt(msgId)], (error, results) => {
            if (error) {
                // If an error occurs during query execution, log the error and send a response with an error message
                console.error('SERVER-ERROR: Error executing query:', error);
                return sendResponse(res, 500, 'An error occurred while deleting the message.');
            }

            // Check if any rows were affected by the delete operation
            if (results.affectedRows === 0) {
                console.error("SERVER-DEBUG: No message found with the provided 'id'.");
                return sendResponse(res, 404, "Message not found.");
            }

            // Log successful deletion
            console.log("SERVER-DEBUG: Message deleted successfully. msgId:", msgId);

            // If a row was deleted, send a response with the deleted message id
            return sendResponse(res, 200, "Message deleted successfully", { id: msgId });
        });
    });

    // Route to update the reported status of a message by ID
    router.put('/reportMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/reportMessage' handler.");

        // Extract the msgId and reported from the query parameters
        const msgId = req.query.id;
        const msgReported = req.query.report === 'true' ? 1 : 0;

        // Log the extracted parameters for debugging
        console.log("SERVER-DEBUG: msg_id <- " + msgId);
        console.log("SERVER-DEBUG: msg_reported <- " + msgReported);

        // Validate that msgId is a positive integer
        if (!msgId || isNaN(msgId) || parseInt(msgId) <= 0 || !Number.isInteger(Number(msgId))) {
            console.error("SERVER-ERROR: Invalid or missing 'id'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'id' is required and must be a positive integer.");
        }

        // Validate that reported is either true or false
        if (req.query.report !== 'true' && req.query.report !== 'false') {
            console.error("SERVER-ERROR: Invalid or missing 'reported'. It must be 'true' or 'false'.");
            return sendResponse(res, 400, "Bad Request: 'reported' is required and must be 'true' or 'false'.");
        }

        // Define the SQL query to update the reported status of the message with the given msgId
        const query = `UPDATE messages SET reported = ? WHERE id = ?`;

        // Execute the SQL query
        connection.query(query, [msgReported, parseInt(msgId)], (error, results) => {
            if (error) {
                console.error('SERVER-ERROR: Error executing query:', error);
                return sendResponse(res, 500, 'An error occurred while updating the reported field.');
            }

            // Check if the update query affected any rows in the database
            if (results.affectedRows === 0) {
                console.error("SERVER-DEBUG: No message found with the provided 'id'.");
                return sendResponse(res, 404, "Message not found.");
            }

            // Log successful update
            console.log("SERVER-DEBUG: Message reported status updated successfully. msgId:", msgId);

            // If the update was successful, return the updated reported status
            return sendResponse(res, 200, "Message reported status updated successfully", {
                id: msgId,
                reported: msgReported === 1 ? true : false
            });
        });
    });

    // Route to update the modified status of a message by ID
    router.put('/modifiedMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/modifiedMessage' handler.");

        // Extract the msgId and modified from the query parameters
        const msgId = req.query.id;
        const msgModified = req.query.modified === 'true' ? 1 : 0;

        // Log the extracted parameters for debugging
        console.log("SERVER-DEBUG: msg_id <- " + msgId);
        console.log("SERVER-DEBUG: msg_modified <- " + msgModified);

        // Validate that msgId is a positive integer
        if (!msgId || isNaN(msgId) || parseInt(msgId) <= 0 || !Number.isInteger(Number(msgId))) {
            console.error("SERVER-ERROR: Invalid or missing 'id'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'id' is required and must be a positive integer.");
        }

        // Validate that modified is either true or false
        if (req.query.modified !== 'true' && req.query.modified !== 'false') {
            console.error("SERVER-ERROR: Invalid or missing 'modified'. It must be 'true' or 'false'.");
            return sendResponse(res, 400, "Bad Request: 'modified' is required and must be 'true' or 'false'.");
        }

        // Define the SQL query to update the modified status of the message with the given msgId
        const query = `UPDATE messages SET modified = ? WHERE id = ?`;

        // Execute the SQL query
        connection.query(query, [msgModified, parseInt(msgId)], (error, results) => {
            if (error) {
                console.error('SERVER-ERROR: Error executing query:', error);
                return sendResponse(res, 500, 'An error occurred while updating the modified field.');
            }

            // Check if the update query affected any rows in the database
            if (results.affectedRows === 0) {
                console.error("SERVER-DEBUG: No message found with the provided 'id'.");
                return sendResponse(res, 404, "Message not found.");
            }

            // Log successful update
            console.log("SERVER-DEBUG: Message modified status updated successfully. msgId:", msgId);

            // If the update was successful, return the updated modified status
            return sendResponse(res, 200, "Message modified status updated successfully", {
                id: msgId,
                modified: msgModified === 1 ? true : false
            });
        });
    });

    // Route to get unread sender IDs for the current user
    router.get('/getUnreadSenderIDs', (req, res) => {
        console.log("SERVER-DEBUG: router '/getUnreadSenderIDs' handler.");

        // Extract the currentUserId from the query parameters
        const currentUserId = req.query.currentUserId;

        // Log the extracted parameter for debugging
        console.log("SERVER-DEBUG: current_user_id <- " + currentUserId);

        // Validate that currentUserId is a positive integer
        if (!currentUserId || isNaN(currentUserId) || parseInt(currentUserId) <= 0 || !Number.isInteger(Number(currentUserId))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentUserId' is required and must be a positive integer.");
        }

        // Define the SQL query to fetch distinct unread sender IDs for the current user
        const query = `SELECT DISTINCT sender FROM messages WHERE receiver = ? AND isItRead = 0 AND isItGroup = 0`;

        // Execute the SQL query with the currentUserId
        connection.query(query, [parseInt(currentUserId)], (error, results) => {
            if (error) {
                console.error("SERVER-ERROR: Error fetching unread sender IDs:", error);
                return sendResponse(res, 500, "An error occurred while fetching unread sender IDs.");
            }

            // Map the results to extract sender IDs and convert them to integers
            const senderIDs = results.map(result => parseInt(result.sender));

            // Log the result for debugging
            console.log("SERVER-DEBUG: Unread sender IDs:", senderIDs);

            // Send the response with the list of sender IDs
            return sendResponse(res, 200, "Unread sender IDs fetched successfully.", senderIDs);
        });
    });

    // Route to get unread group receiver IDs for the current user
    router.get('/getUnreadSenderIDsGroup', (req, res) => {
        console.log("SERVER-DEBUG: router '/getUnreadSenderIDsGroup' handler.");

        // Extract the currentUserId from the query parameters
        const currentUserId = req.query.currentUserId;

        // Log the extracted parameter for debugging
        console.log("SERVER-DEBUG: current_user_id <- " + currentUserId);

        // Validate that currentUserId is a positive integer
        if (!currentUserId || isNaN(currentUserId) || parseInt(currentUserId) <= 0 || !Number.isInteger(Number(currentUserId))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentUserId' is required and must be a positive integer.");
        }

        // First, check if the user exists in the users table
        const userCheckQuery = `SELECT id FROM users WHERE id = ?`;

        connection.query(userCheckQuery, [parseInt(currentUserId)], (userError, userResults) => {
            if (userError) {
                console.error("SERVER-ERROR: Error checking if user exists:", userError);
                return sendResponse(res, 500, "An error occurred while checking user existence.");
            }

            if (userResults.length === 0) {
                console.log("SERVER-DEBUG: No user found with the provided 'currentUserId'.");
                return sendResponse(res, 404, "User not found.");
            }

            // Define the SQL query to fetch distinct unread group receiver IDs for the current user
            const query = `
                SELECT DISTINCT receiver 
                FROM messages 
                WHERE isItGroup = 1 AND sender != ? 
                AND NOT JSON_CONTAINS(readedBy, ?)
            `;

            // Execute the SQL query with the currentUserId for both sender and readedBy checks
            connection.query(query, [parseInt(currentUserId), currentUserId.toString()], (error, results) => {
                if (error) {
                    console.error("SERVER-ERROR: Error fetching unread group receiver IDs:", error);
                    return sendResponse(res, 500, "An error occurred while fetching unread group receiver IDs.");
                }

                // Map the results to extract receiver IDs and convert them to integers
                const receiverIDs = results.map(result => parseInt(result.receiver));

                // Log the result for debugging
                console.log("SERVER-DEBUG: Unread group receiver IDs:", receiverIDs);

                // Send the response with the list of receiver IDs
                return sendResponse(res, 200, "Unread group receiver IDs fetched successfully.", receiverIDs);
            });
        });
    });

    return router;
};