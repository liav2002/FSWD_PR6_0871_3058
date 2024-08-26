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
    router.post('/AddGroup', (req, res) => {
        console.log("SERVER-DEBUG: router '/AddGroup' handler.");

        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        const newGroup = req.body;

        console.log("SERVER-DEBUG: request body:");
        console.log("SERVER-DEBUG: group details:", newGroup);

        const requiredFields = ['adminId', 'participantsId', 'title', 'profil', 'description'];
        for (let field of requiredFields) {
            if (!newGroup[field]) {
                console.error(`SERVER-ERROR: Missing required parameter '${field}'.`);
                return sendResponse(res, 400, `Bad Request: '${field}' is required.`);
            }
        }

        if (!Array.isArray(newGroup.participantsId)) {
            console.error("SERVER-ERROR: Invalid format for 'participantsId'. Expected a JSON array.");
            return sendResponse(res, 400, "Bad Request: 'participantsId' must be a valid JSON array.");
        }

        const sanitizedGroup = {
            adminId: parseInt(newGroup.adminId),
            participantsId: JSON.stringify(newGroup.participantsId),
            title: connection.escape(newGroup.title.trim()),
            profil: connection.escape(newGroup.profil.trim()),
            description: connection.escape(newGroup.description.trim())
        };

        if (isNaN(sanitizedGroup.adminId) || sanitizedGroup.adminId <= 0) {
            console.error("SERVER-ERROR: Invalid 'adminId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'adminId' must be a positive integer.");
        }

        const query = 'INSERT INTO chat_groups (adminId, participantsId, title, profil, description) VALUES (?, ?, ?, ?, ?)';

        connection.query(query, [
            sanitizedGroup.adminId,
            sanitizedGroup.participantsId,
            sanitizedGroup.title,
            sanitizedGroup.profil,
            sanitizedGroup.description
        ], (err, results) => {
            if (err) {
                console.error('SERVER-ERROR: Error in request execution', err);
                return sendResponse(res, 500, 'An error occurred while inserting chat group details.');
            }

            console.log("SERVER-DEBUG: New chat group created with ID:", results.insertId);
            return sendResponse(res, 201, "Chat group created successfully.", { id: results.insertId });
        });
    });

    router.get('/GroupInfo', (req, res) => {
        console.log("SERVER-DEBUG: router '/GroupInfo' handler.");

        const groupId = req.query.GroupId;
        console.log("SERVER-DEBUG: group_id <- " + groupId);

        if (!groupId || isNaN(groupId) || parseInt(groupId) <= 0 || !Number.isInteger(Number(groupId))) {
            console.error("SERVER-ERROR: Invalid or missing 'GroupId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'GroupId' is required and must be a positive integer.");
        }

        const query = 'SELECT * FROM chat_groups WHERE id = ?';

        connection.query(query, [parseInt(groupId)], (err, results) => {
            if (err) {
                console.error("SERVER-ERROR: Error in request execution", err);
                return sendResponse(res, 500, 'An error occurred while retrieving group details.');
            }

            if (results.length === 0) {
                console.log("SERVER-DEBUG: No group found with the provided 'GroupId'.");
                return sendResponse(res, 404, 'Group not found.');
            }

            const group = results[0];
            console.log("SERVER-DEBUG: group info:", group);

            return sendResponse(res, 200, 'Group details retrieved successfully.', group);
        });
    });

    router.put('/RemoveParticipant', (req, res) => {
        console.log("SERVER-DEBUG: router '/RemoveParticipant' handler.");

        const groupId = req.query.GroupId;
        const participantId = req.query.ParticipantId;
        console.log("SERVER-DEBUG: group_id <- " + groupId + ", participant_id <- " + participantId);

        if (!groupId || isNaN(groupId) || parseInt(groupId) <= 0 || !Number.isInteger(Number(groupId))) {
            console.error("SERVER-ERROR: Invalid or missing 'GroupId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'GroupId' is required and must be a positive integer.");
        }

        if (!participantId || isNaN(participantId) || parseInt(participantId) <= 0 || !Number.isInteger(Number(participantId))) {
            console.error("SERVER-ERROR: Invalid or missing 'ParticipantId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'ParticipantId' is required and must be a positive integer.");
        }

        const selectQuery = 'SELECT participantsId FROM chat_groups WHERE id = ?';

        connection.query(selectQuery, [parseInt(groupId)], (err, results) => {
            if (err) {
                console.error("SERVER-ERROR: Error in request execution", err);
                return sendResponse(res, 500, 'An error occurred while fetching group data.');
            }

            if (results.length === 0) {
                console.log("SERVER-DEBUG: No group found with the provided 'GroupId'.");
                return sendResponse(res, 404, 'Group not found.');
            }

            let participants = results[0].participantsId;

            if (!Array.isArray(participants) || !participants.includes(parseInt(participantId))) {
                console.log("SERVER-DEBUG: Participant not found in group.");
                return sendResponse(res, 404, 'Participant not found in the group.');
            }

            participants = participants.filter(id => id !== parseInt(participantId));

            const updateQuery = 'UPDATE chat_groups SET participantsId = ? WHERE id = ?';

            connection.query(updateQuery, [JSON.stringify(participants), parseInt(groupId)], (err, updateResults) => {
                if (err) {
                    console.error("SERVER-ERROR: Error in updating participants", err);
                    return sendResponse(res, 500, 'An error occurred while updating the group.');
                }

                console.log("SERVER-DEBUG: Participant removed successfully. Group ID:", groupId, ", Participant ID:", participantId);
                return sendResponse(res, 200, 'Participant removed successfully.', { groupId: parseInt(groupId), participantId: parseInt(participantId) });
            });
        });
    });

    router.get('/GroupParticipants', (req, res) => {
        console.log("SERVER-DEBUG: router '/GroupParticipants' handler.");

        const groupId = req.query.GroupId;
        console.log("SERVER-DEBUG: group_id <- " + groupId);

        if (!groupId || isNaN(groupId) || parseInt(groupId) <= 0 || !Number.isInteger(Number(groupId))) {
            console.error("SERVER-ERROR: Invalid or missing 'GroupId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'GroupId' is required and must be a positive integer.");
        }

        const query = 'SELECT participantsId FROM chat_groups WHERE id = ?';

        connection.query(query, [parseInt(groupId)], (err, results) => {
            if (err) {
                console.error("SERVER-ERROR: Error in request execution", err);
                return sendResponse(res, 500, 'An error occurred while retrieving participants.');
            }

            if (results.length === 0) {
                console.log("SERVER-DEBUG: No group found with the provided 'GroupId'.");
                return sendResponse(res, 404, 'Group not found.');
            }

            const participantsIds = results[0].participantsId;
            console.log("SERVER-DEBUG: Raw participantsId from DB:", participantsIds);

            if (!Array.isArray(participantsIds)) {
                console.error("SERVER-ERROR: participantsId is not a valid array.");
                return sendResponse(res, 500, "Invalid participantsId format.");
            }

            const participantQuery = 'SELECT id, name FROM users WHERE id IN (?)';

            connection.query(participantQuery, [participantsIds], (err, participants) => {
                if (err) {
                    console.error("SERVER-ERROR: Error in retrieving participants", err);
                    return sendResponse(res, 500, 'An error occurred while retrieving participant details.');
                }

                console.log("SERVER-DEBUG: Participants details:", participants);
                return sendResponse(res, 200, 'Participants retrieved successfully.', participants);
            });
        });
    });

    return router;
};