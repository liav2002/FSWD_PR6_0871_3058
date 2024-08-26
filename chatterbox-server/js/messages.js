const express = require('express');
const router = express.Router();

function sendResponse(res, status, message, data = null) {
    const response = { message };

    if (data !== null) {
        response.data = data;
    }

    res.status(status).json(response);
}

module.exports = (connection) => {

    router.get('/messagesWithCurrentUser', (req, res) => {
        console.log("SERVER-DEBUG: router '/messagesWithCurrentUser' handler.");

        const currentId = req.query.currentId;
        const selectedUserId = req.query.selectedUserId;

        console.log("SERVER-DEBUG: current_user_id <- " + currentId);
        console.log("SERVER-DEBUG: selected_user_id <- " + selectedUserId);

        if (!currentId || isNaN(currentId) || parseInt(currentId) <= 0 || !Number.isInteger(Number(currentId))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentId' is required and must be a positive integer.");
        }

        if (!selectedUserId || isNaN(selectedUserId) || parseInt(selectedUserId) <= 0 || !Number.isInteger(Number(selectedUserId))) {
            console.error("SERVER-ERROR: Invalid or missing 'selectedUserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'selectedUserId' is required and must be a positive integer.");
        }

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

          

            console.log("SERVER-DEBUG: Messages retrieved successfully:", rows);
            return sendResponse(res, 200, "Messages retrieved successfully", rows);
        });
    });

    router.get('/messagesWithCurrentGroup', (req, res) => {
        console.log("SERVER-DEBUG: router '/messagesWithCurrentGroup' handler.");

        const groupId = req.query.groupId;

        console.log("SERVER-DEBUG: group_id <- " + groupId);

        if (!groupId || isNaN(groupId) || parseInt(groupId) <= 0 || !Number.isInteger(Number(groupId))) {
            console.error("SERVER-ERROR: Invalid or missing 'groupId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'groupId' is required and must be a positive integer.");
        }

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

    router.post('/addMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/addMessage' handler.");

        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        const newMsg = req.body; 

        console.log("SERVER-DEBUG: request body:");
        console.log("SERVER-DEBUG: message details:", newMsg);

        const requiredFields = ['sender', 'receiver', 'text', 'date', 'hour', 'isItGroup'];
        for (let field of requiredFields) {
            if (newMsg[field] === undefined) {
                console.error(`SERVER-ERROR: Missing required parameter '${field}'.`);
                return sendResponse(res, 400, `Bad Request: '${field}' is required.`);
            }
        }

        if (isNaN(newMsg.sender) || parseInt(newMsg.sender) <= 0 || !Number.isInteger(Number(newMsg.sender))) {
            console.error("SERVER-ERROR: Invalid 'sender'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'sender' must be a positive integer.");
        }

        if (isNaN(newMsg.receiver) || parseInt(newMsg.receiver) <= 0 || !Number.isInteger(Number(newMsg.receiver))) {
            console.error("SERVER-ERROR: Invalid 'receiver'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'receiver' must be a positive integer.");
        }

        const insertQuery = 'INSERT INTO messages SET ?';
        const selectQuery = 'SELECT * FROM messages WHERE id = ?';

        connection.query(insertQuery, [newMsg], (err, results) => {
            if (err) {
                console.error('SERVER-ERROR: Error executing query:', err);
                return sendResponse(res, 500, 'An error occurred while adding the new message.');
            }

            const newMsgId = results.insertId; 

            connection.query(selectQuery, [newMsgId], (err, results1) => {
                if (err) {
                    console.error('SERVER-ERROR: Error executing query:', err);
                    return sendResponse(res, 500, 'An error occurred while retrieving the newly added message.');
                }

                const newMessage = results1[0]; 
                console.log("SERVER-DEBUG: New message successfully added:", newMessage);

                return sendResponse(res, 200, "Message added successfully", newMessage);
            });
        });
    });

    router.put('/updateMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/updateMessage' handler.");

        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        const msgId = req.query.id;
        const msg = req.body; 
        const msgText = msg.text;

        console.log("SERVER-DEBUG: Request parameters and body:");
        console.log("SERVER-DEBUG: msg_id <- " + msgId);
        console.log("SERVER-DEBUG: msg_text <- " + msgText);

        if (!msgId || isNaN(msgId) || parseInt(msgId) <= 0 || !Number.isInteger(Number(msgId))) {
            console.error("SERVER-ERROR: Invalid or missing 'id'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'id' is required and must be a positive integer.");
        }

        if (!msgText) {
            console.error("SERVER-ERROR: Missing required fields 'text'.");
            return sendResponse(res, 400, "Bad Request: 'text' are required.");
        }

        const query = `UPDATE messages SET text = ? WHERE id = ?`;

        connection.query(query, [msgText, parseInt(msgId)], (error, results) => {
            if (error) {
                console.error("SERVER-ERROR: Error executing the query:", error);
                return sendResponse(res, 500, "An error occurred while updating the message.");
            }

            if (results.affectedRows === 0) {
                return sendResponse(res, 404, "Message not found.");
            }

            console.log("SERVER-DEBUG: Message updated successfully.");

            return sendResponse(res, 200, "Message updated successfully", {
                id: msgId,
                text: msgText
            });
        });
    });

    router.delete('/deleteMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/deleteMessage' handler.");

        let msgId = req.query.id;

        console.log("SERVER-DEBUG: msg_id <- " + msgId);

        if (!msgId || isNaN(msgId) || parseInt(msgId) <= 0 || !Number.isInteger(Number(msgId))) {
            console.error("SERVER-ERROR: Invalid or missing 'id'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'id' is required and must be a positive integer.");
        }

        const query = `DELETE FROM messages WHERE id = ?`;

        connection.query(query, [parseInt(msgId)], (error, results) => {
            if (error) {
                console.error('SERVER-ERROR: Error executing query:', error);
                return sendResponse(res, 500, 'An error occurred while deleting the message.');
            }

            if (results.affectedRows === 0) {
                console.error("SERVER-DEBUG: No message found with the provided 'id'.");
                return sendResponse(res, 404, "Message not found.");
            }

            console.log("SERVER-DEBUG: Message deleted successfully. msgId:", msgId);

            return sendResponse(res, 200, "Message deleted successfully", { id: msgId });
        });
    });

    router.put('/reportMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/reportMessage' handler.");

        const msgId = req.query.id;
        const msgReported = req.query.report === 'true' ? 1 : 0;

        console.log("SERVER-DEBUG: msg_id <- " + msgId);
        console.log("SERVER-DEBUG: msg_reported <- " + msgReported);

        if (!msgId || isNaN(msgId) || parseInt(msgId) <= 0 || !Number.isInteger(Number(msgId))) {
            console.error("SERVER-ERROR: Invalid or missing 'id'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'id' is required and must be a positive integer.");
        }

        if (req.query.report !== 'true' && req.query.report !== 'false') {
            console.error("SERVER-ERROR: Invalid or missing 'report'. It must be 'true' or 'false'.");
            return sendResponse(res, 400, "Bad Request: 'report' is required and must be 'true' or 'false'.");
        }

        const query = `UPDATE messages SET reported = ? WHERE id = ?`;

        connection.query(query, [msgReported, parseInt(msgId)], (error, results) => {
            if (error) {
                console.error('SERVER-ERROR: Error executing query:', error);
                return sendResponse(res, 500, 'An error occurred while updating the reported field.');
            }

            if (results.affectedRows === 0) {
                console.error("SERVER-DEBUG: No message found with the provided 'id'.");
                return sendResponse(res, 404, "Message not found.");
            }

            console.log("SERVER-DEBUG: Message reported status updated successfully. msgId:", msgId);

            return sendResponse(res, 200, "Message reported status updated successfully", {
                id: msgId,
                reported: msgReported === 1 ? true : false
            });
        });
    });

    router.put('/modifiedMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/modifiedMessage' handler.");

        const msgId = req.query.id;
        const msgModified = req.query.modified === 'true' ? 1 : 0;

        console.log("SERVER-DEBUG: msg_id <- " + msgId);
        console.log("SERVER-DEBUG: msg_modified <- " + msgModified);

        if (!msgId || isNaN(msgId) || parseInt(msgId) <= 0 || !Number.isInteger(Number(msgId))) {
            console.error("SERVER-ERROR: Invalid or missing 'id'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'id' is required and must be a positive integer.");
        }

        if (req.query.modified !== 'true' && req.query.modified !== 'false') {
            console.error("SERVER-ERROR: Invalid or missing 'modified'. It must be 'true' or 'false'.");
            return sendResponse(res, 400, "Bad Request: 'modified' is required and must be 'true' or 'false'.");
        }

        const query = `UPDATE messages SET modified = ? WHERE id = ?`;

        connection.query(query, [msgModified, parseInt(msgId)], (error, results) => {
            if (error) {
                console.error('SERVER-ERROR: Error executing query:', error);
                return sendResponse(res, 500, 'An error occurred while updating the modified field.');
            }

            if (results.affectedRows === 0) {
                console.error("SERVER-DEBUG: No message found with the provided 'id'.");
                return sendResponse(res, 404, "Message not found.");
            }

            console.log("SERVER-DEBUG: Message modified status updated successfully. msgId:", msgId);

            return sendResponse(res, 200, "Message modified status updated successfully", {
                id: msgId,
                modified: msgModified === 1 ? true : false
            });
        });
    });

    router.get('/getUnreadSenderIDs', (req, res) => {
        console.log("SERVER-DEBUG: router '/getUnreadSenderIDs' handler.");

        const currentUserId = req.query.currentUserId;

        console.log("SERVER-DEBUG: current_user_id <- " + currentUserId);

        if (!currentUserId || isNaN(currentUserId) || parseInt(currentUserId) <= 0 || !Number.isInteger(Number(currentUserId))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentUserId' is required and must be a positive integer.");
        }

        const query = `SELECT DISTINCT sender FROM messages WHERE receiver = ? AND isItRead = 0 AND isItGroup = 0`;

        connection.query(query, [parseInt(currentUserId)], (error, results) => {
            if (error) {
                console.error("SERVER-ERROR: Error fetching unread sender IDs:", error);
                return sendResponse(res, 500, "An error occurred while fetching unread sender IDs.");
            }

            const senderIDs = results.map(result => parseInt(result.sender));

            console.log("SERVER-DEBUG: Unread sender IDs:", senderIDs);

            return sendResponse(res, 200, "Unread sender IDs fetched successfully.", senderIDs);
        });
    });

    router.get('/getUnreadSenderIDsGroup', (req, res) => {
        console.log("SERVER-DEBUG: router '/getUnreadSenderIDsGroup' handler.");

        const currentUserId = req.query.currentUserId;

        console.log("SERVER-DEBUG: current_user_id <- " + currentUserId);

        if (!currentUserId || isNaN(currentUserId) || parseInt(currentUserId) <= 0 || !Number.isInteger(Number(currentUserId))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentUserId' is required and must be a positive integer.");
        }

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

            const query = `
                SELECT DISTINCT receiver 
                FROM messages 
                WHERE isItGroup = 1 AND sender != ? 
                AND NOT JSON_CONTAINS(readedBy, ?)
            `;

            connection.query(query, [parseInt(currentUserId), currentUserId.toString()], (error, results) => {
                if (error) {
                    console.error("SERVER-ERROR: Error fetching unread group receiver IDs:", error);
                    return sendResponse(res, 500, "An error occurred while fetching unread group receiver IDs.");
                }

                const receiverIDs = results.map(result => parseInt(result.receiver));

                console.log("SERVER-DEBUG: Unread group receiver IDs:", receiverIDs);

                return sendResponse(res, 200, "Unread group receiver IDs fetched successfully.", receiverIDs);
            });
        });
    });

    router.put('/markMessagesAsRead', (req, res) => {
        console.log("SERVER-DEBUG: router '/markMessagesAsRead' handler.");

        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        const { currentUserId, selectedUserId } = req.body;
        console.log("SERVER-DEBUG: current_user_id <- " + currentUserId);
        console.log("SERVER-DEBUG: selected_user_id <- " + selectedUserId);

        if (!currentUserId || isNaN(currentUserId) || parseInt(currentUserId) <= 0 || !Number.isInteger(Number(currentUserId))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentUserId' is required and must be a positive integer.");
        }

        if (!selectedUserId || isNaN(selectedUserId) || parseInt(selectedUserId) <= 0 || !Number.isInteger(Number(selectedUserId))) {
            console.error("SERVER-ERROR: Invalid or missing 'selectedUserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'selectedUserId' is required and must be a positive integer.");
        }

        const query = `
            UPDATE messages 
            SET isItRead = 1 
            WHERE receiver = ? AND sender = ? AND isItGroup = 0
        `;

        connection.query(query, [parseInt(currentUserId), parseInt(selectedUserId)], (err, updateResult) => {
            if (err) {
                console.error("SERVER-ERROR: Error updating messages:", err);
                return sendResponse(res, 500, "Error updating messages.");
            }

            console.log("SERVER-DEBUG: Messages marked as read:", updateResult);

            return sendResponse(res, 200, "Messages marked as read.");
        });
    });

    router.put('/markMessagesGroupAsRead', (req, res) => {
        console.log("SERVER-DEBUG: router '/markMessagesGroupAsRead' handler.");

        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        const { currentUserId, selectedUserId } = req.body;

        console.log("SERVER-DEBUG: current_user_id <- " + currentUserId);
        console.log("SERVER-DEBUG: selected_user_id <- " + selectedUserId);

        if (!currentUserId || isNaN(currentUserId) || parseInt(currentUserId) <= 0 || !Number.isInteger(Number(currentUserId))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentUserId' is required and must be a positive integer.");
        }

        if (!selectedUserId || isNaN(selectedUserId) || parseInt(selectedUserId) <= 0 || !Number.isInteger(Number(selectedUserId))) {
            console.error("SERVER-ERROR: Invalid or missing 'selectedUserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'selectedUserId' is required and must be a positive integer.");
        }

        const query0 = `SELECT id FROM messages WHERE receiver = ? AND sender != ? AND isItGroup = 1;`;

        connection.query(query0, [selectedUserId, currentUserId], (err, result0) => {
            if (err) {
                console.error("SERVER-ERROR: Error fetching messages:", err);
                return sendResponse(res, 500, "Error fetching messages.");
            }

            const groupIds = result0.map(row => row.id);

            if (groupIds.length === 0) {
                console.log("SERVER-DEBUG: No messages found to update.");
                return sendResponse(res, 200, "No messages found to update.");
            }

            const query = `
                UPDATE messages 
                SET readedBy = JSON_ARRAY_APPEND(readedBy, '$', ?)
                WHERE id IN (?) AND NOT JSON_CONTAINS(readedBy, ?);
            `;

            connection.query(query, [currentUserId, groupIds, currentUserId.toString()], (err, updateResult) => {
                if (err) {
                    console.error("SERVER-ERROR: Error updating messages:", err);
                    return sendResponse(res, 500, "Error updating messages.");
                }

                console.log("SERVER-DEBUG: Messages marked as read:", updateResult);

                const query1 = `
                    UPDATE messages 
                    SET isItRead = 1 
                    WHERE JSON_LENGTH(readedBy) = (SELECT JSON_LENGTH(participantsId) FROM chat_groups WHERE id = ?) - 1;
                `;

                connection.query(query1, [selectedUserId], (err, updateRead) => {
                    if (err) {
                        console.error("SERVER-ERROR: Error updating messages:", err);
                        return sendResponse(res, 500, "Error updating messages.");
                    }

                    console.log("SERVER-DEBUG: Messages fully marked as read:", updateRead);

                    const selectQuery = 'SELECT id FROM messages WHERE receiver = ? AND isItGroup = 1 AND isItRead = 1';
                    connection.query(selectQuery, [selectedUserId], (selectErr, selectResult) => {
                        if (selectErr) {
                            console.error("SERVER-ERROR: Error selecting messages:", selectErr);
                            return sendResponse(res, 500, "An error occurred while selecting messages.");
                        }

                        const messageIds = selectResult.map(row => row.id);

                        console.log("SERVER-DEBUG: Messages read by all participants:", messageIds);

                        return sendResponse(res, 200, "Messages read by all participants fetched successfully.", messageIds);
                    });
                });
            });
        });
    });

    return router;
};