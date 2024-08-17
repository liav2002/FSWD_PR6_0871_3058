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

        // Step 1: Check if the message ID exists in the messages table
        const checkMessageQuery = 'SELECT id FROM messages WHERE id = ?';
        connection.query(checkMessageQuery, [sanitizedReportedMsg.msgId], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('SERVER-ERROR: Error in request execution', checkErr);
                return sendResponse(res, 500, 'An error occurred while checking the message ID.');
            }

            if (checkResults.length === 0) {
                console.error("SERVER-ERROR: Message ID does not exist in the messages table.");
                return sendResponse(res, 404, 'Message ID does not exist.');
            }

            // Step 2: Begin transaction to ensure atomicity
            connection.beginTransaction(err => {
                if (err) {
                    console.error("SERVER-ERROR: Transaction error", err);
                    return sendResponse(res, 500, 'An error occurred while starting the transaction.');
                }

                // Step 3: Insert the new reported message into the reported_msg table
                const insertQuery = `
                INSERT INTO reported_msg (msgId, sender, receiver, text, date, hour, image, isItGroup, checked, deleted) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

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
                        return connection.rollback(() => {
                            sendResponse(res, 500, 'An error occurred while adding the new reported message.');
                        });
                    }

                    const newReportedMsgId = results.insertId; // Get the ID of the newly inserted reported message

                    // Step 4: Update the `reported` field in the `messages` table for the reported message
                    const updateMessageQuery = `UPDATE messages SET reported = true WHERE id = ?`;

                    connection.query(updateMessageQuery, [sanitizedReportedMsg.msgId], (updateErr, updateResults) => {
                        if (updateErr) {
                            console.error('SERVER-ERROR: Error updating the messages table', updateErr);
                            return connection.rollback(() => {
                                sendResponse(res, 500, 'An error occurred while updating the message as reported.');
                            });
                        }

                        // Step 5: Commit the transaction
                        connection.commit(commitErr => {
                            if (commitErr) {
                                console.error('SERVER-ERROR: Transaction commit error', commitErr);
                                return connection.rollback(() => {
                                    sendResponse(res, 500, 'An error occurred while committing the transaction.');
                                });
                            }

                            // Step 6: Log the successful insertion and return the ID of the new reported message
                            console.log("SERVER-DEBUG: New reported message added with ID:", newReportedMsgId);
                            return sendResponse(res, 201, 'Reported message added and message updated successfully.', { id: newReportedMsgId });
                        });
                    });
                });
            });
        });
    });

    // GET all reported messages (checked = true)
    router.get('/getAllReportedMsg', (req, res) => {
        console.log("SERVER-DEBUG: router '/getAllReportedMsg' handler.");

        // SQL query to retrieve all reported (reported) messages
        const query = `SELECT * FROM reported_msg`;

        connection.query(query, (err, reportedRows) => {
            if (err) {
                console.error("SERVER-ERROR: Error executing the query:", err);
                return sendResponse(res, 500, "An error occurred while retrieving reported messages.");
            }

            // Check if no reported messages are found
            if (reportedRows.length === 0) {
                console.log("SERVER-DEBUG: No reported messages found.");
                return sendResponse(res, 404, "No reported messages found.");
            }

            // Log the reported messages for debugging purposes
            console.log("SERVER-DEBUG: Reported messages retrieved:", reportedRows);

            // Return the reported messages in the response
            return sendResponse(res, 200, "Reported messages retrieved successfully.", reportedRows);
        });
    });

    // POST to mark a message as checked and update the reported status
    router.post('/markMessageChecked/:messageId', (req, res) => {
        console.log("SERVER-DEBUG: router '/markMessageChecked' handler.");
        
        const messageId = req.params.messageId;

        // Log the message ID for debugging purposes
        console.log("SERVER-DEBUG: messageId <- " + messageId);

        // Validate that messageId is a positive integer
        if (!messageId || isNaN(messageId) || parseInt(messageId) <= 0 || !Number.isInteger(Number(messageId))) {
            console.error("SERVER-ERROR: Invalid 'messageId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'messageId' must be a positive integer.");
        }

        // Query to update the 'checked' variable in the 'reported_msg' table
        const updateReportedMsgQuery = 'UPDATE reported_msg SET checked = true WHERE msgId = ?';
        connection.query(updateReportedMsgQuery, [parseInt(messageId)], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("SERVER-ERROR: Error updating the 'checked' status:", updateErr);
                return sendResponse(res, 500, "An error occurred while updating the 'checked' status.");
            }

            // Check if any rows were affected
            if (updateResult.affectedRows === 0) {
                console.log("SERVER-DEBUG: No reported message found with the specified 'messageId'.");
                return sendResponse(res, 404, "Reported message not found.");
            }

            // Query to update the 'reported' status in the 'messages' table
            const updateMessageQuery = 'UPDATE messages SET reported = false WHERE id = ?';
            connection.query(updateMessageQuery, [parseInt(messageId)], (updateMessageErr, updateMessageResult) => {
                if (updateMessageErr) {
                    console.error("SERVER-ERROR: Error updating the 'reported' status in 'messages':", updateMessageErr);
                    return sendResponse(res, 500, "An error occurred while updating the 'reported' status in the messages.");
                }

                // Check if any rows were affected
                if (updateMessageResult.affectedRows === 0) {
                    console.log("SERVER-DEBUG: No message found with the specified 'messageId'.");
                    return sendResponse(res, 404, "Message not found.");
                }

                // Successfully updated both tables
                console.log("SERVER-DEBUG: Message 'checked' and 'reported' status updated successfully.");
                return sendResponse(res, 200, "Message checked and reported status updated successfully.");
            });
        });
    });

    // POST to mark a reported message as deleted and remove it from the messages table
    router.post('/deleteReportedMessage/:messageId', (req, res) => {
        console.log("SERVER-DEBUG: router '/deleteReportedMessage' handler.");
        
        const messageId = req.params.messageId;

        // Log the message ID for debugging purposes
        console.log("SERVER-DEBUG: messageId <- " + messageId);

        // Validate that messageId is a positive integer
        if (!messageId || isNaN(messageId) || parseInt(messageId) <= 0 || !Number.isInteger(Number(messageId))) {
            console.error("SERVER-ERROR: Invalid 'messageId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'messageId' must be a positive integer.");
        }

        // Query to update the 'checked' and 'deleted' fields in the 'reported_msg' table
        const updateReportedMsgQuery = 'UPDATE reported_msg SET checked = true, deleted = true WHERE msgId = ?';
        connection.query(updateReportedMsgQuery, [parseInt(messageId)], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("SERVER-ERROR: Error updating the reported message:", updateErr);
                return sendResponse(res, 500, "An error occurred while updating the reported message.");
            }

            // Check if any rows were affected
            if (updateResult.affectedRows === 0) {
                console.log("SERVER-DEBUG: No reported message found with the specified 'messageId'.");
                return sendResponse(res, 404, "Reported message not found.");
            }

            // Query to delete the message from the 'messages' table
            const deleteMessageQuery = 'DELETE FROM messages WHERE id = ?';
            connection.query(deleteMessageQuery, [parseInt(messageId)], (deleteErr, deleteResult) => {
                if (deleteErr) {
                    console.error("SERVER-ERROR: Error deleting the message from 'messages':", deleteErr);
                    return sendResponse(res, 500, "An error occurred while deleting the message from the messages table.");
                }

                // Check if any rows were affected by the delete operation
                if (deleteResult.affectedRows === 0) {
                    console.log("SERVER-DEBUG: No message found with the specified 'messageId'.");
                    return sendResponse(res, 404, "Message not found.");
                }

                // Successfully marked the reported message as deleted and removed it from the messages table
                console.log("SERVER-DEBUG: Reported message marked as deleted and message removed successfully.");
                return sendResponse(res, 200, "Reported message marked as deleted and message removed successfully.");
            });
        });
    });

    // DELETE a reported message
    router.delete('/id', (req, res) => {
        console.log("SERVER-DEBUG: router '/id' handler.");

        const msgId = req.query.id;  

        // Log the request parameters
        console.log("SERVER-DEBUG: request parameters:");
        console.log("SERVER-DEBUG: msgId <- ", msgId);

        // Validate that msgId is provided and is a positive integer
        if (!msgId || isNaN(msgId) || parseInt(msgId) <= 0 || !Number.isInteger(Number(msgId))) {
            console.error("SERVER-ERROR: Invalid or missing 'msgId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'msgId' is required and must be a positive integer.");
        }

        // Define the SQL query to delete a reported message with the given msgId
        const query = `DELETE FROM reported_msg WHERE msgId = ?`;

        // Execute the SQL query with the msgId as a parameter
        connection.query(query, [parseInt(msgId)], (error, results) => {
            if (error) {
                // If an error occurs during the query execution, log the error and send a response with an error message
                console.error('SERVER-ERROR: Error in request execution', error);
                return sendResponse(res, 500, 'An error occurred while deleting the reported message.');
            }

            // Check if any rows were affected by the delete operation
            if (results.affectedRows === 0) {
                // If no rows were affected, send a response with an error message
                return sendResponse(res, 404, 'Reported message not found.');
            }

            // If a row was affected (reported message deleted), send a response with the deleted msgId
            console.log("SERVER-DEBUG: Reported message deleted successfully, msgId:", msgId);
            return sendResponse(res, 200, 'Reported message deleted successfully.', { msgId: parseInt(msgId) });
        });
    });

    return router;
};