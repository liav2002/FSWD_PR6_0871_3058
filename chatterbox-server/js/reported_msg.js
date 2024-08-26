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

    router.post('/addReportedMessage', (req, res) => {
        console.log("SERVER-DEBUG: router '/addReportedMessage' handler.");

        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        const newReportedMsg = req.body; 

        console.log("SERVER-DEBUG: request body:");
        console.log("SERVER-DEBUG: reported message details:", newReportedMsg);

        const requiredFields = ['msgId', 'sender', 'receiver', 'text', 'date', 'hour', 'isItGroup'];
        for (let field of requiredFields) {
            if (newReportedMsg[field] === undefined || newReportedMsg[field] === null) {
                console.error(`SERVER-ERROR: Missing required parameter '${field}'.`);
                return sendResponse(res, 400, `Bad Request: '${field}' is required.`);
            }
        }

        if (typeof newReportedMsg.isItGroup !== 'boolean' && ![0, 1].includes(newReportedMsg.isItGroup)) {
            console.error("SERVER-ERROR: Invalid 'isItGroup' type.");
            return sendResponse(res, 400, "Bad Request: 'isItGroup' must be a boolean or 0/1.");
        }

        const sanitizedReportedMsg = {
            msgId: parseInt(newReportedMsg.msgId),
            sender: parseInt(newReportedMsg.sender),
            receiver: parseInt(newReportedMsg.receiver),
            text: newReportedMsg.text.trim(),
            date: newReportedMsg.date.trim(),
            hour: newReportedMsg.hour.trim(),
            image: newReportedMsg.image ? newReportedMsg.image.trim() : null,
            isItGroup: newReportedMsg.isItGroup === true || newReportedMsg.isItGroup === 1 ? 1 : 0,
            checked: 0,  
            deleted: 0  
        };

        if (isNaN(sanitizedReportedMsg.msgId) || sanitizedReportedMsg.msgId <= 0 ||
            isNaN(sanitizedReportedMsg.sender) || sanitizedReportedMsg.sender <= 0 ||
            isNaN(sanitizedReportedMsg.receiver) || sanitizedReportedMsg.receiver <= 0) {
            console.error("SERVER-ERROR: Invalid 'msgId', 'sender' or 'receiver'. They must be positive integers.");
            return sendResponse(res, 400, "Bad Request: 'msgId', 'sender', and 'receiver' must be positive integers.");
        }

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

            connection.beginTransaction(err => {
                if (err) {
                    console.error("SERVER-ERROR: Transaction error", err);
                    return sendResponse(res, 500, 'An error occurred while starting the transaction.');
                }

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

                    const newReportedMsgId = results.insertId; 

                    const updateMessageQuery = `UPDATE messages SET reported = true WHERE id = ?`;

                    connection.query(updateMessageQuery, [sanitizedReportedMsg.msgId], (updateErr, updateResults) => {
                        if (updateErr) {
                            console.error('SERVER-ERROR: Error updating the messages table', updateErr);
                            return connection.rollback(() => {
                                sendResponse(res, 500, 'An error occurred while updating the message as reported.');
                            });
                        }

                        connection.commit(commitErr => {
                            if (commitErr) {
                                console.error('SERVER-ERROR: Transaction commit error', commitErr);
                                return connection.rollback(() => {
                                    sendResponse(res, 500, 'An error occurred while committing the transaction.');
                                });
                            }

                            console.log("SERVER-DEBUG: New reported message added with ID:", newReportedMsgId);
                            return sendResponse(res, 201, 'Reported message added and message updated successfully.', { id: newReportedMsgId });
                        });
                    });
                });
            });
        });
    });

    router.get('/getAllReportedMsg', (req, res) => {
        console.log("SERVER-DEBUG: router '/getAllReportedMsg' handler.");

        const query = `SELECT * FROM reported_msg`;

        connection.query(query, (err, reportedRows) => {
            if (err) {
                console.error("SERVER-ERROR: Error executing the query:", err);
                return sendResponse(res, 500, "An error occurred while retrieving reported messages.");
            }

            if (reportedRows.length === 0) {
                console.log("SERVER-DEBUG: No reported messages found.");
                return sendResponse(res, 404, "No reported messages found.");
            }

            console.log("SERVER-DEBUG: Reported messages retrieved:", reportedRows);

            return sendResponse(res, 200, "Reported messages retrieved successfully.", reportedRows);
        });
    });

    router.post('/markMessageChecked/:messageId', (req, res) => {
        console.log("SERVER-DEBUG: router '/markMessageChecked' handler.");
        
        const messageId = req.params.messageId;

        console.log("SERVER-DEBUG: messageId <- " + messageId);

        if (!messageId || isNaN(messageId) || parseInt(messageId) <= 0 || !Number.isInteger(Number(messageId))) {
            console.error("SERVER-ERROR: Invalid 'messageId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'messageId' must be a positive integer.");
        }

        const updateReportedMsgQuery = 'UPDATE reported_msg SET checked = true WHERE msgId = ?';
        connection.query(updateReportedMsgQuery, [parseInt(messageId)], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("SERVER-ERROR: Error updating the 'checked' status:", updateErr);
                return sendResponse(res, 500, "An error occurred while updating the 'checked' status.");
            }

            if (updateResult.affectedRows === 0) {
                console.log("SERVER-DEBUG: No reported message found with the specified 'messageId'.");
                return sendResponse(res, 404, "Reported message not found.");
            }

            const updateMessageQuery = 'UPDATE messages SET reported = false WHERE id = ?';
            connection.query(updateMessageQuery, [parseInt(messageId)], (updateMessageErr, updateMessageResult) => {
                if (updateMessageErr) {
                    console.error("SERVER-ERROR: Error updating the 'reported' status in 'messages':", updateMessageErr);
                    return sendResponse(res, 500, "An error occurred while updating the 'reported' status in the messages.");
                }

                if (updateMessageResult.affectedRows === 0) {
                    console.log("SERVER-DEBUG: No message found with the specified 'messageId'.");
                    return sendResponse(res, 404, "Message not found.");
                }

                console.log("SERVER-DEBUG: Message 'checked' and 'reported' status updated successfully.");
                return sendResponse(res, 200, "Message checked and reported status updated successfully.");
            });
        });
    });

    router.post('/deleteReportedMessage/:messageId', (req, res) => {
        console.log("SERVER-DEBUG: router '/deleteReportedMessage' handler.");
        
        const messageId = req.params.messageId;
        console.log("SERVER-DEBUG: messageId <- " + messageId);

        if (!messageId || isNaN(messageId) || parseInt(messageId) <= 0 || !Number.isInteger(Number(messageId))) {
            console.error("SERVER-ERROR: Invalid 'messageId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'messageId' must be a positive integer.");
        }

        const updateReportedMsgQuery = 'UPDATE reported_msg SET checked = true, deleted = true WHERE msgId = ?';
        connection.query(updateReportedMsgQuery, [parseInt(messageId)], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("SERVER-ERROR: Error updating the reported message:", updateErr);
                return sendResponse(res, 500, "An error occurred while updating the reported message.");
            }

            if (updateResult.affectedRows === 0) {
                console.log("SERVER-DEBUG: No reported message found with the specified 'messageId'.");
                return sendResponse(res, 404, "Reported message not found.");
            }

            const deleteMessageQuery = 'DELETE FROM messages WHERE id = ?';
            connection.query(deleteMessageQuery, [parseInt(messageId)], (deleteErr, deleteResult) => {
                if (deleteErr) {
                    console.error("SERVER-ERROR: Error deleting the message from 'messages':", deleteErr);
                    return sendResponse(res, 500, "An error occurred while deleting the message from the messages table.");
                }

                if (deleteResult.affectedRows === 0) {
                    console.log("SERVER-DEBUG: No message found with the specified 'messageId'.");
                    return sendResponse(res, 404, "Message not found.");
                }

                console.log("SERVER-DEBUG: Reported message marked as deleted and message removed successfully.");
                return sendResponse(res, 200, "Reported message marked as deleted and message removed successfully.");
            });
        });
    });

    router.delete('/cancelReportByClient', (req, res) => {
        console.log("SERVER-DEBUG: router '/cancelReportByClient' handler.");

        const msgId = req.query.msgId;
        console.log("SERVER-DEBUG: msg_id <- " + msgId);

        if (!msgId || isNaN(msgId) || parseInt(msgId) <= 0) {
            console.error("SERVER-ERROR: Invalid or missing 'msgId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'msgId' is required and must be a positive integer.");
        }

        const deleteReportedQuery = 'DELETE FROM reported_msg WHERE msgId = ?';

        connection.query(deleteReportedQuery, [parseInt(msgId)], (err, result) => {
            if (err) {
                console.error('SERVER-ERROR: Error while deleting report from reported_msg table:', err);
                return sendResponse(res, 500, 'Error occurred while deleting the reported message.');
            }

            if (result.affectedRows === 0) {
                console.log("SERVER-DEBUG: No report found with the provided 'msgId'.");
                return sendResponse(res, 404, 'No report found for the provided message.');
            }

            console.log("SERVER-DEBUG: Report successfully deleted from reported_msg table for msgId:", msgId);

            const updateMessageQuery = 'UPDATE messages SET reported = false WHERE id = ?';

            connection.query(updateMessageQuery, [parseInt(msgId)], (err, updateResult) => {
                if (err) {
                    console.error('SERVER-ERROR: Error while updating the message:', err);
                    return sendResponse(res, 500, 'Error occurred while updating the message.');
                }

                if (updateResult.affectedRows === 0) {
                    console.log("SERVER-DEBUG: No message found with the provided 'msgId'.");
                    return sendResponse(res, 404, 'No message found to update the report status.');
                }

                console.log("SERVER-DEBUG: Message successfully updated for msgId:", msgId);
                return sendResponse(res, 200, 'Report canceled and message updated successfully.');
            });
        });
    });

    return router;
};