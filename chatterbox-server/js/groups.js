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

    return router;
};