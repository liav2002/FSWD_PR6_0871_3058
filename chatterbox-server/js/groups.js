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

    // Route to add a new chat group
    router.post('/AddGroup', (req, res) => {
        console.log("SERVER-DEBUG: router '/AddGroup' handler.");

        // Check if the Content-Type is application/json
        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        const newGroup = req.body; // Extract the newGroup object from the request body

        // Log the request body for debugging purposes
        console.log("SERVER-DEBUG: request body:");
        console.log("SERVER-DEBUG: group details:", newGroup);

        // Validate required fields in the newGroup object
        const requiredFields = ['adminId', 'participantsId', 'title', 'profil', 'description'];
        for (let field of requiredFields) {
            if (!newGroup[field]) {
                console.error(`SERVER-ERROR: Missing required parameter '${field}'.`);
                return sendResponse(res, 400, `Bad Request: '${field}' is required.`);
            }
        }

        // Validate that participantsId is a valid JSON array
        if (!Array.isArray(newGroup.participantsId)) {
            console.error("SERVER-ERROR: Invalid format for 'participantsId'. Expected a JSON array.");
            return sendResponse(res, 400, "Bad Request: 'participantsId' must be a valid JSON array.");
        }

        // Secure and sanitize inputs
        const sanitizedGroup = {
            adminId: parseInt(newGroup.adminId),
            participantsId: JSON.stringify(newGroup.participantsId),
            title: connection.escape(newGroup.title.trim()),
            profil: connection.escape(newGroup.profil.trim()),
            description: connection.escape(newGroup.description.trim())
        };

        // Ensure the adminId is a positive integer
        if (isNaN(sanitizedGroup.adminId) || sanitizedGroup.adminId <= 0) {
            console.error("SERVER-ERROR: Invalid 'adminId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'adminId' must be a positive integer.");
        }

        // SQL query to insert the new group into the chat_groups table
        const query = 'INSERT INTO chat_groups (adminId, participantsId, title, profil, description) VALUES (?, ?, ?, ?, ?)';

        // Execute the SQL query
        connection.query(query, [
            sanitizedGroup.adminId,
            sanitizedGroup.participantsId,
            sanitizedGroup.title,
            sanitizedGroup.profil,
            sanitizedGroup.description
        ], (err, results) => {
            if (err) {
                // If an error occurs during the query execution, log the error and send a response with an error message
                console.error('SERVER-ERROR: Error in request execution', err);
                return sendResponse(res, 500, 'An error occurred while inserting chat group details.');
            }

            // If the query execution is successful, return the ID of the newly created group
            console.log("SERVER-DEBUG: New chat group created with ID:", results.insertId);
            return sendResponse(res, 201, "Chat group created successfully.", { id: results.insertId });
        });
    });

    // GET group info
    router.get('/GroupInfo', (req, res) => {
        console.log("SERVER-DEBUG: router '/GroupInfo' handler.");

        // Extract the GroupId from the query parameters and log it
        const groupId = req.query.GroupId;
        console.log("SERVER-DEBUG: group_id <- " + groupId);

        // Validate that the groupId is provided and is a positive integer
        if (!groupId || isNaN(groupId) || parseInt(groupId) <= 0 || !Number.isInteger(Number(groupId))) {
            console.error("SERVER-ERROR: Invalid or missing 'GroupId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'GroupId' is required and must be a positive integer.");
        }

        // Create an SQL query with a prepared parameter to get group info
        const query = 'SELECT * FROM chat_groups WHERE id = ?';

        // Execute the SQL query with the groupId as a parameter
        connection.query(query, [parseInt(groupId)], (err, results) => {
            if (err) {
                // If an error occurs during query execution, log the error and send a response
                console.error("SERVER-ERROR: Error in request execution", err);
                return sendResponse(res, 500, 'An error occurred while retrieving group details.');
            }

            // Check if the group exists
            if (results.length === 0) {
                console.log("SERVER-DEBUG: No group found with the provided 'GroupId'.");
                return sendResponse(res, 404, 'Group not found.');
            }

            // Log the retrieved group details for debugging purposes
            const group = results[0];
            console.log("SERVER-DEBUG: group info:", group);

            // Send the group information in the response
            return sendResponse(res, 200, 'Group details retrieved successfully.', group);
        });
    });

    // PUT request to remove a participant from a group
    router.put('/RemoveParticipant', (req, res) => {
        console.log("SERVER-DEBUG: router '/RemoveParticipant' handler.");

        // Extract the GroupId and ParticipantId from the query parameters
        const groupId = req.query.GroupId;
        const participantId = req.query.ParticipantId;
        console.log("SERVER-DEBUG: group_id <- " + groupId + ", participant_id <- " + participantId);

        // Validate that the GroupId and ParticipantId are provided and are positive integers
        if (!groupId || isNaN(groupId) || parseInt(groupId) <= 0 || !Number.isInteger(Number(groupId))) {
            console.error("SERVER-ERROR: Invalid or missing 'GroupId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'GroupId' is required and must be a positive integer.");
        }

        if (!participantId || isNaN(participantId) || parseInt(participantId) <= 0 || !Number.isInteger(Number(participantId))) {
            console.error("SERVER-ERROR: Invalid or missing 'ParticipantId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'ParticipantId' is required and must be a positive integer.");
        }

        // SQL query to get the participantsId for the given group
        const selectQuery = 'SELECT participantsId FROM chat_groups WHERE id = ?';

        // Execute the SQL query to retrieve participantsId for the group
        connection.query(selectQuery, [parseInt(groupId)], (err, results) => {
            if (err) {
                console.error("SERVER-ERROR: Error in request execution", err);
                return sendResponse(res, 500, 'An error occurred while fetching group data.');
            }

            // Check if the group was found
            if (results.length === 0) {
                console.log("SERVER-DEBUG: No group found with the provided 'GroupId'.");
                return sendResponse(res, 404, 'Group not found.');
            }

            // Assuming participantsId is stored as an array in the database
            let participants = results[0].participantsId;

            // Check if the participant is part of the group
            if (!Array.isArray(participants) || !participants.includes(parseInt(participantId))) {
                console.log("SERVER-DEBUG: Participant not found in group.");
                return sendResponse(res, 404, 'Participant not found in the group.');
            }

            // Remove the participant from the list
            participants = participants.filter(id => id !== parseInt(participantId));

            // SQL query to update the participantsId in the chat_groups table
            const updateQuery = 'UPDATE chat_groups SET participantsId = ? WHERE id = ?';

            // Execute the SQL query to update the group
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



    // GET participants' names of a group
    router.get('/GroupParticipants', (req, res) => {
        console.log("SERVER-DEBUG: router '/GroupParticipants' handler.");

        // Extract the GroupId from the query parameters and log it
        const groupId = req.query.GroupId;
        console.log("SERVER-DEBUG: group_id <- " + groupId);

        // Validate that the groupId is provided and is a positive integer
        if (!groupId || isNaN(groupId) || parseInt(groupId) <= 0 || !Number.isInteger(Number(groupId))) {
            console.error("SERVER-ERROR: Invalid or missing 'GroupId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'GroupId' is required and must be a positive integer.");
        }

        // Retrieve the participantsId array from the chat_groups table
        const query = 'SELECT participantsId FROM chat_groups WHERE id = ?';

        connection.query(query, [parseInt(groupId)], (err, results) => {
            if (err) {
                console.error("SERVER-ERROR: Error in request execution", err);
                return sendResponse(res, 500, 'An error occurred while retrieving participants.');
            }

            // Check if the group exists
            if (results.length === 0) {
                console.log("SERVER-DEBUG: No group found with the provided 'GroupId'.");
                return sendResponse(res, 404, 'Group not found.');
            }

            // Log the raw participantsId for debugging purposes
            const participantsIds = results[0].participantsId;
            console.log("SERVER-DEBUG: Raw participantsId from DB:", participantsIds);

            // Ensure participantsIds is an array
            if (!Array.isArray(participantsIds)) {
                console.error("SERVER-ERROR: participantsId is not a valid array.");
                return sendResponse(res, 500, "Invalid participantsId format.");
            }

            // Retrieve participant details
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