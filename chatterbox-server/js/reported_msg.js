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

    // POST a reported message
    router.post('/addReportedMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/addReportedMessage' handler.");

        // Check if the Content-Type is application/json
        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        const newReportedMsg = req.body; // Extract the new reported message data from the request body

        // Log the request body for debugging purposes
        console.log("SERVER-DEBUG: request body:");
        console.log("SERVER-DEBUG: reported message details:", newReportedMsg);

        // Validate required fields in the newReportedMsg object
        const requiredFields = ['msgId', 'sender', 'receiver', 'text', 'date', 'hour', 'isItGroup'];
        for (let field of requiredFields) {
            if (newReportedMsg[field] === undefined || newReportedMsg[field] === null) {
                console.error(`SERVER-ERROR: Missing required parameter '${field}'.`);
                return sendResponse(res, 400, `Bad Request: '${field}' is required.`);
            }
        }

        // Ensure isItGroup is either boolean or valid number (0 or 1)
        if (typeof newReportedMsg.isItGroup !== 'boolean' && ![0, 1].includes(newReportedMsg.isItGroup)) {
            console.error("SERVER-ERROR: Invalid 'isItGroup' type.");
            return sendResponse(res, 400, "Bad Request: 'isItGroup' must be a boolean or 0/1.");
        }

        // Secure and sanitize inputs using parameterized query to prevent SQL injection
        const sanitizedReportedMsg = {
            msgId: parseInt(newReportedMsg.msgId),
            sender: parseInt(newReportedMsg.sender),
            receiver: parseInt(newReportedMsg.receiver),
            text: newReportedMsg.text.trim(),
            date: newReportedMsg.date.trim(),
            hour: newReportedMsg.hour.trim(),
            image: newReportedMsg.image ? newReportedMsg.image.trim() : null,
            isItGroup: newReportedMsg.isItGroup === true || newReportedMsg.isItGroup === 1 ? 1 : 0,
            checked: 0,  // New reported messages are unchecked by default
            deleted: 0   // New reported messages are not deleted by default
        };

        // Validate that msgId, sender, and receiver are positive integers
        if (isNaN(sanitizedReportedMsg.msgId) || sanitizedReportedMsg.msgId <= 0 ||
            isNaN(sanitizedReportedMsg.sender) || sanitizedReportedMsg.sender <= 0 ||
            isNaN(sanitizedReportedMsg.receiver) || sanitizedReportedMsg.receiver <= 0) {
            console.error("SERVER-ERROR: Invalid 'msgId', 'sender' or 'receiver'. They must be positive integers.");
            return sendResponse(res, 400, "Bad Request: 'msgId', 'sender', and 'receiver' must be positive integers.");
        }

        // SQL query to insert the new reported message into the reported_msg table
        const insertQuery = `
        INSERT INTO reported_msg (msgId, sender, receiver, text, date, hour, image, isItGroup, checked, deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Execute the SQL query with the sanitized reported message data
        connection.query(insertQuery, [
            sanitizedReportedMsg.msgId,
            sanitizedReportedMsg.sender,
            sanitizedReportedMsg.receiver,
            sanitizedReportedMsg.text,
            sanitizedReportedMsg.date,
            sanitizedReportedMsg.hour,
            sanitizedReportedMsg.image,
            sanitizedReportedMsg.isItGroup,
            sanitizedReportedMsg.checked,
            sanitizedReportedMsg.deleted
        ], (insertErr, results) => {
            if (insertErr) {
                console.error('SERVER-ERROR: Error in request execution', insertErr);
                return sendResponse(res, 500, 'An error occurred while adding the new reported message.');
            }

            const newReportedMsgId = results.insertId; // Get the ID of the newly inserted reported message

            // Log the successful insertion and return the ID of the new reported message
            console.log("SERVER-DEBUG: New reported message added with ID:", newReportedMsgId);
            return sendResponse(res, 201, 'Reported message added successfully.', { id: newReportedMsgId });
        });
    });

    // GET all flagged messages (checked = true)
    router.get('/getAllReportedMsg', (req, res) => {
        console.log("SERVER-DEBUG: router '/getAllReportedMsg' handler.");

        // SQL query to retrieve all flagged (reported) messages
        const query = `SELECT * FROM reported_msg`;

        connection.query(query, (err, reportedRows) => {
            if (err) {
                console.error("SERVER-ERROR: Error executing the query:", err);
                return sendResponse(res, 500, "An error occurred while retrieving reported messages.");
            }

            // Check if no flagged messages are found
            if (reportedRows.length === 0) {
                console.log("SERVER-DEBUG: No reported messages found.");
                return sendResponse(res, 404, "No reported messages found.");
            }

            // Log the flagged messages for debugging purposes
            console.log("SERVER-DEBUG: Reported messages retrieved:", reportedRows);

            // Return the flagged messages in the response
            return sendResponse(res, 200, "Reported messages retrieved successfully.", reportedRows);
        });
    });

    return router;
};