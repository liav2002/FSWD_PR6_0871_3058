const express = require('express');
const router = express.Router();
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');

const adminUsers = [1];

function sendResponse(res, status, message, data = null) {
    const response = { message };

    if (data !== null) {
        response.data = data;
    }

    res.status(status).json(response);
}

module.exports = (connection) => {
    
    router.get('/loginUser', (req, res) => {
        console.log("SERVER-DEBUG: router '/loginUser' handler.");

        const phone = req.query.phone;
        const password = req.query.password;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: phone <- " + phone);
        console.log("SERVER-DEBUG: password <- " + password);

        if (!phone || !password) {
            console.error("SERVER-ERROR: Missing required parameters 'phone' or 'password'.");
            return sendResponse(res, 400, "Bad Request: 'phone' and 'password' are required.");
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            console.error("SERVER-ERROR: Invalid phone format.");
            return sendResponse(res, 400, "Bad Request: Invalid phone format. Must be 10 digits.");
        }

        connection.query('SELECT * FROM users WHERE phone = ?', [phone], (err, rows) => {
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
                return sendResponse(res, 500, 'Failed retrieving user information');
            }

            if (rows.length === 0) {
                console.log("SERVER-DEBUG: No user found with the provided phone.");
                return sendResponse(res, 404, 'User not found');
            }

            const user = rows[0]; 

            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('SERVER-ERROR: Error comparing passwords:', err);
                    return sendResponse(res, 500, 'Failed to verify password');
                }

                if (!isMatch) {
                    console.log("SERVER-DEBUG: Incorrect password.");
                    return sendResponse(res, 401, 'Invalid credentials');
                }

                const userInfo = {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    profil: user.profil,
                    status: user.status
                };

                console.log("SERVER-DEBUG: User successfully authenticated.");
                return sendResponse(res, 200, 'User authenticated successfully', userInfo);
            });
        });
    });

    router.post('/registerUser', async (req, res) => {
        console.log("SERVER-DEBUG: router '/registerUser' handler.");

        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return sendResponse(res, 400, "Bad Request: Content-Type must be application/json.");
        }

        const user = req.body; 

        console.log("SERVER-DEBUG: request body:");
        console.log("SERVER-DEBUG: user details:");
        console.log(user);

        const requiredFields = ['name', 'phone', 'email', 'profilePictureOption', 'status', 'password'];
        for (let field of requiredFields) {
            if (!user[field]) {
                console.error(`SERVER-ERROR: Missing required parameter '${field}'.`);
                return sendResponse(res, 400, `Bad Request: '${field}' is required.`);
            }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
        const phoneRegex = /^[0-9]{10}$/; 
        const statusOptions = ['available', 'busy']; 

        if (typeof user.name !== 'string' || user.name.trim().length === 0) {
            console.error("SERVER-ERROR: Invalid name format.");
            return sendResponse(res, 400, "Bad Request: Invalid name format.");
        }

        if (!emailRegex.test(user.email)) {
            console.error("SERVER-ERROR: Invalid email format.");
            return sendResponse(res, 400, "Bad Request: Invalid email format.");
        }

        if (!phoneRegex.test(user.phone)) {
            console.error("SERVER-ERROR: Invalid phone format. Must be 10 digits.");
            return sendResponse(res, 400, "Bad Request: Invalid phone format. Must be 10 digits.");
        }

        if (!statusOptions.includes(user.status)) {
            console.error("SERVER-ERROR: Invalid status. Must be 'available' or 'busy'.");
            return sendResponse(res, 400, "Bad Request: Invalid status. Must be 'available' or 'busy'.");
        }

        if (typeof user.password !== 'string' || user.password.length < 6) {
            console.error("SERVER-ERROR: Invalid password. Must be at least 6 characters long.");
            return sendResponse(res, 400, "Bad Request: Invalid password. Must be at least 6 characters long.");
        }

        try {
            const hashedPassword = await bcrypt.hash(user.password, 10); 

            connection.query('SELECT * FROM users WHERE phone = ?', [user.phone], (err, rows) => {
                if (err) {
                    console.error('SERVER-ERROR: Error while executing the query:', err);
                    return sendResponse(res, 500, 'SERVER-ERROR: Failed checking phone');
                }

                if (rows.length > 0) {
                    console.log("SERVER-DEBUG: Phone number already in use. Rows:", rows);
                    return sendResponse(res, 400, 'Phone number is already in use');
                }

                connection.query(
                    'INSERT INTO users (name, phone, email, profil, status, password) VALUES (?, ?, ?, ?, ?, ?)',
                    [user.name.trim(), user.phone.trim(), user.email.trim(), user.profilePictureOption.trim(), user.status.trim(), hashedPassword],
                    (err, result) => {
                        if (err) {
                            console.error('SERVER-ERROR: Failed while inserting user into the database:', err);
                            return sendResponse(res, 500, 'Failed inserting user into the database');
                        }

                        const userToAdd = {
                            id: result.insertId,
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            profil: user.profilePictureOption,
                            status: user.status
                        };

                        console.log("SERVER-DEBUG: User successfully registered:", userToAdd);
                        return sendResponse(res, 201, 'User registered successfully', userToAdd); 
                    }
                );
            });
        } catch (error) {
            console.error("SERVER-ERROR: Error while hashing password:", error);
            return sendResponse(res, 500, "SERVER-ERROR: Failed hashing password");
        }
    });

    router.get('/UserInfo', (req, res) => {
        console.log("SERVER-DEBUG: router '/UserInfo' handler.");

        const userId = req.query.UserId;
        console.log("SERVER-DEBUG: user_id <- " + userId);

        if (!userId || isNaN(userId) || parseInt(userId) <= 0 || !Number.isInteger(Number(userId))) {
            console.error("SERVER-ERROR: Invalid or missing 'UserId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'UserId' is required and must be a positive integer.");
        }

        const query = 'SELECT * FROM users WHERE id = ?';
        connection.query(query, [parseInt(userId)], (err, results) => {
            if (err) {
                console.error('SERVER-ERROR: Failed in request execution', err);
                return sendResponse(res, 500, 'An error occurred while retrieving user details.');
            }

            if (results.length === 0) {
                console.error("SERVER-DEBUG: No user found with the provided 'UserId'.");
                return sendResponse(res, 404, 'User not found');
            }

            const user = results[0];
            console.log("SERVER-DEBUG: user information:", user);
            return sendResponse(res, 200, 'User found', user);
        });
    });

    router.put('/updateUserInfo', async (req, res) => {
        console.log("SERVER-DEBUG: router '/updateUserInfo' handler.");

        const userId = req.query.id; 
        const userName = req.query.name;
        const userStatus = req.query.status;
        const userPassword = req.query.password;
        const userEmail = req.query.email;
        const userProfile = req.query.profil;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: user_id <- " + userId);
        console.log("SERVER-DEBUG: user_name <- " + userName);
        console.log("SERVER-DEBUG: user_status <- " + userStatus);
        console.log("SERVER-DEBUG: user_password <- " + userPassword);
        console.log("SERVER-DEBUG: user_email <- " + userEmail);
        console.log("SERVER-DEBUG: user_profile <- " + userProfile);

        if (!userId || !userName || !userStatus || !userPassword || !userEmail || !userProfile) {
            console.error("SERVER-ERROR: Missing required parameter(s).");
            return sendResponse(res, 400, "Bad Request: All fields (id, name, status, password, email, profil) are required.");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const statusOptions = ['available', 'busy'];

        if (!emailRegex.test(userEmail)) {
            console.error("SERVER-ERROR: Invalid email format.");
            return sendResponse(res, 400, "Bad Request: Invalid email format.");
        }

        if (!statusOptions.includes(userStatus)) {
            console.error("SERVER-ERROR: Invalid status. Must be 'available' or 'busy'.");
            return sendResponse(res, 400, "Bad Request: Invalid status. Must be 'available' or 'busy'.");
        }

        try {
            const hashedPassword = await bcrypt.hash(userPassword, 10);

            const query = 'UPDATE users SET name = ?, email = ?, profil = ?, status = ?, password = ? WHERE id = ?';
            connection.query(query, [userName.trim(), userEmail.trim(), userProfile.trim(), userStatus.trim(), hashedPassword, parseInt(userId)], (err, results) => {
                if (err) {
                    console.error('SERVER-ERROR: Failed in request execution', err);
                    return sendResponse(res, 500, 'An error occurred while updating user details.');
                }

                if (results.affectedRows === 0) {
                    return sendResponse(res, 404, 'User not found');
                }

                return sendResponse(res, 200, 'User profile updated successfully', { userId: parseInt(userId) });
            });
        } catch (error) {
            console.error("SERVER-ERROR: Error while hashing password:", error);
            return sendResponse(res, 500, "Failed to hash the password.");
        }
    });

    router.get('/ParticipantsInfo', (req, res) => {
        console.log("SERVER-DEBUG: router '/ParticipantsInfo' handler.");

        const groupId = req.query.GroupId;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: group_id <- " + groupId);

        if (!groupId || isNaN(groupId) || parseInt(groupId) <= 0 || !Number.isInteger(Number(groupId))) {
            console.error("SERVER-ERROR: Invalid or missing 'GroupId'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'GroupId' is required and must be a positive integer.");
        }

        const query = 'SELECT participantsId FROM chat_groups WHERE id = ?';

        connection.query(query, [parseInt(groupId)], (err, results) => {
            if (err) {
                console.error('SERVER-ERROR: Failed in request execution', err);
                return sendResponse(res, 500, 'An error occurred while retrieving participants information.');
            }

            if (results.length === 0) {
                console.error("SERVER-DEBUG: No group found with the provided 'GroupId'.");
                return sendResponse(res, 404, 'Group not found.');
            }

            try {
                const group = results[0];
                let participantsIdArray = typeof group.participantsId === 'string'
                    ? JSON.parse(group.participantsId)
                    : group.participantsId;

                if (!Array.isArray(participantsIdArray)) {
                    console.error("SERVER-ERROR: participantsId is not a valid array.");
                    return sendResponse(res, 500, 'Invalid participantsId format.');
                }

                const participantsIdIntegers = participantsIdArray.map(id => parseInt(id)).filter(id => !isNaN(id));

                console.log("SERVER-DEBUG: participantsId as integers:", participantsIdIntegers);
                return sendResponse(res, 200, 'Participants retrieved successfully', { participantsId: participantsIdIntegers });
            } catch (error) {
                console.error("SERVER-ERROR: Error parsing participantsId JSON:", error);
                return sendResponse(res, 500, 'Failed to parse participants information.');
            }
        });
    });

    router.get('/AllUsers', (req, res) => {
        console.log("SERVER-DEBUG: router '/AllUsers' handler.");

        const currentUserID = req.query.currentUserID;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: current_user_id <- " + currentUserID);

        if (!currentUserID || isNaN(currentUserID) || parseInt(currentUserID) <= 0 || !Number.isInteger(Number(currentUserID))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserID'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentUserID' is required and must be a positive integer.");
        }

        connection.query('SELECT * FROM users WHERE id != ?', [parseInt(currentUserID)], (err, rows) => {
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
                return sendResponse(res, 500, 'Error retrieving users.');
            }

            return sendResponse(res, 200, 'Users retrieved successfully', rows);
        });
    });

    router.get('/AllUsersIncludeAdmins', (req, res) => {
        console.log("SERVER-DEBUG: router '/AllUsersIncludeAdmins' handler.");
    
        const adminsFilePath = path.join(__dirname, '..', 'data', 'admins.json');
    
        fs.readFile(adminsFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error("SERVER-ERROR: Failed to read 'admins.json' file:", err);
                return sendResponse(res, 500, 'Error reading admin information.');
            }
    
            let adminIds;
            try {
                const jsonData = JSON.parse(data);
                adminIds = jsonData.adminUsers;
    
                if (!Array.isArray(adminIds)) {
                    throw new Error("Parsed admin IDs are not in an array format");
                }
    
            } catch (parseErr) {
                console.error("SERVER-ERROR: Failed to parse 'admins.json' file:", parseErr);
                return sendResponse(res, 500, 'Error parsing admin information.');
            }
    
            connection.query('SELECT * FROM users', (err, rows) => {
                if (err) {
                    console.error('SERVER-ERROR: Failed executing the query:', err);
                    return sendResponse(res, 500, 'Error retrieving users.');
                }
    
                const usersWithAdminFlag = rows.map(user => ({
                    ...user,
                    isAdmin: adminIds.includes(user.id) 
                }));
    
                return sendResponse(res, 200, 'Users retrieved successfully', usersWithAdminFlag);
            });
        });
    });

    router.get('/AllUsersAndGroups', (req, res) => {
        console.log("SERVER-DEBUG: router '/AllUsersAndGroups' handler.");

        const currentUserID = req.query.currentUserID;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: current_user_id <- " + currentUserID);

        if (!currentUserID || isNaN(currentUserID) || parseInt(currentUserID) <= 0 || !Number.isInteger(Number(currentUserID))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserID'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentUserID' is required and must be a positive integer.");
        }

        connection.query('SELECT * FROM users WHERE id != ?', [parseInt(currentUserID)], (err, users) => {
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
                return sendResponse(res, 500, 'Error retrieving users.');
            }

            connection.query('SELECT * FROM chat_groups WHERE JSON_CONTAINS(participantsId, ?)', [JSON.stringify([parseInt(currentUserID)])], (err, groups) => {
                if (err) {
                    console.error('SERVER-ERROR: Failed executing the query:', err);
                    return sendResponse(res, 500, 'Error retrieving groups.');
                }

                const combinedData = {
                    users: users,
                    groups: groups
                };

                return sendResponse(res, 200, 'Users and groups retrieved successfully', combinedData);
            });
        });
    });

    router.get('/isAdmin', (req, res) => {
        console.log("SERVER-DEBUG: router '/isAdmin' handler.");
        const currentUserID = req.query.currentUserID;
        console.log("SERVER-DEBUG: currentUserID <- " + currentUserID);

        if (!currentUserID || isNaN(currentUserID) || parseInt(currentUserID) <= 0 || !Number.isInteger(Number(currentUserID))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserID'. It must be a positive integer.");
            return sendResponse(res, 400, "Bad Request: 'currentUserID' is required and must be a positive integer.");
        }

        const jsonFilePath = path.join(__dirname, '../data/admins.json');

        fs.readFile(jsonFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error("SERVER-ERROR: Failed to read 'admins.json'", err);
                return sendResponse(res, 500, 'Internal Server Error: Could not read admin users file.');
            }

            let adminUsers;
            try {
                adminUsers = JSON.parse(data).adminUsers;
            } catch (jsonErr) {
                console.error("SERVER-ERROR: Error parsing 'admins.json'", jsonErr);
                return sendResponse(res, 500, 'Internal Server Error: Could not parse admin users file.');
            }

            const isAdmin = adminUsers.includes(parseInt(currentUserID)) ? 1 : 0;

            console.log("SERVER-DEBUG: User isAdmin status:", isAdmin);
            return sendResponse(res, 200, 'Admin status checked successfully.', { isAdmin });
        });
    });

    return router;
};