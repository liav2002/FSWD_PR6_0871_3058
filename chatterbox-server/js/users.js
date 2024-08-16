const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (connection) => {

    // Login
    router.get('/loginUser', (req, res) => {
        console.log("SERVER-DEBUG: router '/loginUser' handler.");

        const phone = req.query.phone;
        const password = req.query.password;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: phone <- " + phone);
        console.log("SERVER-DEBUG: password <- " + password);

        // Check if the phone and password are provided
        if (!phone || !password) {
            console.error("SERVER-ERROR: Missing required parameters 'phone' or 'password'.");
            return res.status(400).send("Bad Request: 'phone' and 'password' are required.");
        }

        // Validate phone format (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            console.error("SERVER-ERROR: Invalid phone format.");
            return res.status(400).send("Bad Request: Invalid phone format. Must be 10 digits.");
        }

        // SQL query to retrieve the user's information by phone number
        connection.query('SELECT * FROM users WHERE phone = ?', [phone], (err, rows) => {
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
                return res.status(500).send('Failed retrieving user information');
            }

            if (rows.length === 0) {
                console.log("SERVER-DEBUG: No user found with the provided phone.");
                return res.status(404).send('User not found');
            }

            const user = rows[0]; // First result row

            // Compare the provided plain-text password with the hashed password in the database
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('SERVER-ERROR: Error comparing passwords:', err);
                    return res.status(500).send('Failed to verify password');
                }

                if (!isMatch) {
                    console.log("SERVER-DEBUG: Incorrect password.");
                    return res.status(401).send('Invalid credentials');
                }

                // Password is correct, return user info
                const userInfo = {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email,
                    profile: user.profil,
                    status: user.status
                };

                console.log("SERVER-DEBUG: User successfully authenticated.");
                res.json(userInfo);
            });
        });
    });

    // Register
    router.post('/registerUser', async (req, res) => {
        console.log("SERVER-DEBUG: router '/registerUser' handler.");

        // Check if the Content-Type is application/json
        if (!req.is('application/json')) {
            console.error("SERVER-ERROR: Invalid or missing Content-Type. Expected 'application/json'.");
            return res.status(400).send("Bad Request: Content-Type must be application/json.");
        }

        const user = req.body; // Retrieve user data from the request

        console.log("SERVER-DEBUG: request body:");
        console.log("SERVER-DEBUG: user details:");
        console.log(user);

        // Validate required parameters
        const requiredFields = ['name', 'phone', 'email', 'profilePictureOption', 'status', 'password'];
        for (let field of requiredFields) {
            if (!user[field]) {
                console.error(`SERVER-ERROR: Missing required parameter '${field}'.`);
                return res.status(400).send(`Bad Request: '${field}' is required.`);
            }
        }

        // Validation rules
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation regex
        const phoneRegex = /^[0-9]{10}$/; // Basic phone validation: 10 digits
        const statusOptions = ['available', 'busy']; // Valid status options

        // Validate name (must be a non-empty string)
        if (typeof user.name !== 'string' || user.name.trim().length === 0) {
            console.error("SERVER-ERROR: Invalid name format.");
            return res.status(400).send("Bad Request: Invalid name format.");
        }

        // Validate email format
        if (!emailRegex.test(user.email)) {
            console.error("SERVER-ERROR: Invalid email format.");
            return res.status(400).send("Bad Request: Invalid email format.");
        }

        // Validate phone format
        if (!phoneRegex.test(user.phone)) {
            console.error("SERVER-ERROR: Invalid phone format. Must be 10 digits.");
            return res.status(400).send("Bad Request: Invalid phone format. Must be 10 digits.");
        }

        // Validate status
        if (!statusOptions.includes(user.status)) {
            console.error("SERVER-ERROR: Invalid status. Must be 'available' or 'busy'.");
            return res.status(400).send("Bad Request: Invalid status. Must be 'available' or 'busy'.");
        }

        // Validate password (must be at least 6 characters long)
        if (typeof user.password !== 'string' || user.password.length < 6) {
            console.error("SERVER-ERROR: Invalid password. Must be at least 6 characters long.");
            return res.status(400).send("Bad Request: Invalid password. Must be at least 6 characters long.");
        }

        try {
            // Hash the password using bcrypt
            const hashedPassword = await bcrypt.hash(user.password, 10); // 10 is the salt rounds

            // Check if the phone number is already in use
            connection.query('SELECT * FROM users WHERE phone = ?', [user.phone], (err, rows) => {
                if (err) {
                    console.error('SERVER-ERROR: Error while executing the query:', err);
                    return res.status(500).send('SERVER-ERROR: Failed checking phone');
                }

                if (rows.length > 0) {
                    console.log("SERVER-DEBUG: Phone number already in use. Rows:", rows);
                    return res.status(400).send('Phone number is already in use');
                }

                // Insert the user into the database using prepared statements
                connection.query(
                    'INSERT INTO users (name, phone, email, profil, status, password) VALUES (?, ?, ?, ?, ?, ?)',
                    [user.name.trim(), user.phone.trim(), user.email.trim(), user.profilePictureOption.trim(), user.status.trim(), hashedPassword],
                    (err, result) => {
                        if (err) {
                            console.error('SERVER-ERROR: Failed while inserting user into the database:', err);
                            return res.status(500).send('Failed inserting user into the database');
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
                        res.status(201).json(userToAdd); // 201 Created
                    }
                );
            });
        } catch (error) {
            console.error("SERVER-ERROR: Error while hashing password:", error);
            res.status(500).send("SERVER-ERROR: Failed hashing password");
        }
    });

    // User Information
    router.get('/UserInfo', (req, res) => {
        console.log("SERVER-DEBUG: router '/UserInfo' handler.");

        const userId = req.query.UserId;
        console.log("SERVER-DEBUG: user_id <- " + userId);

        // Validate that the userId is provided and is a positive integer
        if (!userId || isNaN(userId) || parseInt(userId) <= 0 || !Number.isInteger(Number(userId))) {
            console.error("SERVER-ERROR: Invalid or missing 'UserId'. It must be a positive integer.");
            return res.status(400).send("Bad Request: 'UserId' is required and must be a positive integer.");
        }

        // Create an SQL query with a prepared parameter
        const query = 'SELECT * FROM users WHERE id = ?';
    
        // Execute the SQL query with the parameter (userId)
        connection.query(query, [parseInt(userId)], (err, results) => {
            if (err) {
                console.error('SERVER-ERROR: Failed in request execution', err);
                return res.status(500).send({ error: 'An error occurred while retrieving user details.' });
            }

            // Check if user exists
            if (results.length === 0) {
                console.error("SERVER-DEBUG: No user found with the provided 'UserId'.");
                return res.status(404).send("User not found.");
            }

            // If the query executed successfully and user exists
            const user = results[0]; 
            console.log("SERVER-DEBUG: user information:");
            console.log(user);
            res.json(user); // Send the user information as a response
        });
    });

    // Update User Information
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

        // Validate required parameters
        if (!userId || !userName || !userStatus || !userPassword || !userEmail || !userProfile) {
            console.error("SERVER-ERROR: Missing required parameter(s).");
            return res.status(400).send("Bad Request: All fields (id, name, status, password, email, profil) are required.");
        }

        // Validate the format of the fields
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation regex
        const statusOptions = ['available', 'busy']; // Valid status options

        // Validate userId (must be a positive integer)
        if (isNaN(userId) || parseInt(userId) <= 0 || !Number.isInteger(Number(userId))) {
            console.error("SERVER-ERROR: Invalid 'UserId'. It must be a positive integer.");
            return res.status(400).send("Bad Request: 'UserId' must be a positive integer.");
        }

        // Validate email
        if (!emailRegex.test(userEmail)) {
            console.error("SERVER-ERROR: Invalid email format.");
            return res.status(400).send("Bad Request: Invalid email format.");
        }

        // Validate status
        if (!statusOptions.includes(userStatus)) {
            console.error("SERVER-ERROR: Invalid status. Must be 'available' or 'busy'.");
            return res.status(400).send("Bad Request: Invalid status. Must be 'available' or 'busy'.");
        }

        try {
            // Hash the password using bcrypt
            const hashedPassword = await bcrypt.hash(userPassword, 10); // 10 is the salt rounds

            const query = `UPDATE users SET name = ?, email = ?, profil = ?, status = ?, password = ? WHERE id = ?`;

            // Execute the SQL query with the parameters
            connection.query(query, [userName.trim(), userEmail.trim(), userProfile.trim(), userStatus.trim(), hashedPassword, parseInt(userId)], (error, results) => {
                if (error) {
                    console.error('SERVER-ERROR: Failed in request execution', error);
                    return res.status(500).send({ error: 'An error occurred while updating the user profile.' });
                }

                // Check if the update query affected any rows in the database
                if (results.affectedRows === 0) {
                    return res.status(404).send({ error: 'User not found' });
                }

                res.status(200).json({ message: 'User profile updated successfully', userId: parseInt(userId) });
            });
        } catch (error) {
            console.error("SERVER-ERROR: Error while hashing password:", error);
            res.status(500).send("SERVER-ERROR: Failed to hash the password.");
        }
    });

    // Information about chat group participants
    router.get('/ParticipantsInfo', (req, res) => {
        console.log("SERVER-DEBUG: router '/ParticipantsInfo' handler.");

        const groupId = req.query.GroupId;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: group_id <- " + groupId);

        // Validate that groupId is provided and is a positive integer
        if (!groupId || isNaN(groupId) || parseInt(groupId) <= 0 || !Number.isInteger(Number(groupId))) {
            console.error("SERVER-ERROR: Invalid or missing 'GroupId'. It must be a positive integer.");
            return res.status(400).send("Bad Request: 'GroupId' is required and must be a positive integer.");
        }

        const query = 'SELECT participantsId FROM chat_groups WHERE id = ?';

        // Execute the SQL query with the parameter
        connection.query(query, [parseInt(groupId)], (err, results) => {
            if (err) {
                console.error('SERVER-ERROR: Failed in request execution', err);
                return res.status(500).send({ error: 'An error occurred while retrieving participants information.' });
            }

            // Check if the group exists
            if (results.length === 0) {
                console.error("SERVER-DEBUG: No group found with the provided 'GroupId'.");
                return res.status(404).send("Group not found.");
            }

            try {
                // Parse the participantsId field as JSON
                const group = results[0];
                let participantsIdArray;

                if (typeof group.participantsId === 'string') {
                    participantsIdArray = JSON.parse(group.participantsId);
                } else {
                    participantsIdArray = group.participantsId;
                }

                // Validate that participantsIdArray is an array
                if (!Array.isArray(participantsIdArray)) {
                    console.error("SERVER-ERROR: participantsId is not a valid array.");
                    return res.status(500).send({ error: "Invalid participantsId format." });
                }

                // Convert participants IDs to integers
                const participantsIdIntegers = participantsIdArray.map(id => parseInt(id)).filter(id => !isNaN(id));

                console.log("SERVER-DEBUG: participantsId as integers: " + participantsIdIntegers);
                res.json({ participantsId: participantsIdIntegers });

            } catch (error) {
                console.error("SERVER-ERROR: Error parsing participantsId JSON:", error);
                res.status(500).send({ error: 'Failed to parse participants information.' });
            }
        });
    });

    // Route to retrieve all users except the currently logged-in user
    router.get('/AllUsers', (req, res) => {
        console.log("SERVER-DEBUG: router '/AllUsers' handler.");

        const currentUserID = req.query.currentUserID;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: current_user_id <- " + currentUserID);

        // Validate that currentUserID is provided and is a positive integer
        if (!currentUserID || isNaN(currentUserID) || parseInt(currentUserID) <= 0 || !Number.isInteger(Number(currentUserID))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserID'. It must be a positive integer.");
            return res.status(400).send("Bad Request: 'currentUserID' is required and must be a positive integer.");
        }

        // Perform the SQL query to get all users except the current user
        connection.query('SELECT * FROM users WHERE id != ?', [parseInt(currentUserID)], (err, rows) => {
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
                return res.status(500).send('Error retrieving users.');
            }
            
            res.json(rows);
        });
    });

    // Route GET to retrieve all users and groups except the currently logged-in user
    router.get('/AllUsersAndGroups', (req, res) => {
        console.log("SERVER-DEBUG: router '/AllUsersAndGroups' handler.");

        const currentUserID = req.query.currentUserID;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: current_user_id <- " + currentUserID);

        // Validate that currentUserID is provided and is a positive integer
        if (!currentUserID || isNaN(currentUserID) || parseInt(currentUserID) <= 0 || !Number.isInteger(Number(currentUserID))) {
            console.error("SERVER-ERROR: Invalid or missing 'currentUserID'. It must be a positive integer.");
            return res.status(400).send("Bad Request: 'currentUserID' is required and must be a positive integer.");
        }

        // Make an SQL query to retrieve all users except the currently logged-in user
        connection.query('SELECT * FROM users WHERE id != ?', [parseInt(currentUserID)], (err, users) => { 
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
                return res.status(500).send('Error retrieving users.');
            }
            
            // Retrieve groups from the database that contain the currentUser's id in the participantsId list
            connection.query('SELECT * FROM chat_groups WHERE JSON_CONTAINS(participantsId, ?)', [JSON.stringify([parseInt(currentUserID)])], (err, groups) => {  
                if (err) {
                    console.error('SERVER-ERROR: Failed executing the query:', err);
                    return res.status(500).send('Error retrieving groups.');
                }

                // Combine the filtered group list with the list of users retrieved from the database
                const combinedData = {
                    users: users,
                    groups: groups
                };

                res.json(combinedData);
            });
        });
    });


    return router;
};