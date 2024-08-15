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
        
        // SQL query to retrieve the user's information with the corresponding phone and password
        connection.query('SELECT * FROM users WHERE phone = ? AND password = ?', [phone, password], (err, rows) => {
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
                res.status(500).send('Failed retrieving user information');
            } 
            
            else {
                if (rows.length === 0) {
                    res.status(404).send('User not found');
                } 
                
                else {
                    const user = rows[0]; // First result row
                    const userInfo = {
                        id: user.id,
                        name: user.name,
                        phone: user.phone,
                        email: user.email,
                        profile: user.profil,
                        status: user.status,
                        password: user.password
                    };
                    res.json(userInfo);
                }
            }
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

            // Sanitize inputs (e.g., escape special characters)
            const sanitizedUser = {
                name: connection.escape(user.name.trim()),
                phone: connection.escape(user.phone.trim()),
                email: connection.escape(user.email.trim()),
                profilePictureOption: connection.escape(user.profilePictureOption.trim()),
                status: connection.escape(user.status.trim()),
                password: hashedPassword // Save the hashed password
            };

            // Check if the phone number is already in use
            connection.query('SELECT * FROM users WHERE phone = ?', [sanitizedUser.phone], (err, rows) => {
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
                    [sanitizedUser.name, sanitizedUser.phone, sanitizedUser.email, sanitizedUser.profilePictureOption, sanitizedUser.status, sanitizedUser.password],
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

        // Validate that the userId is provided
        if (!userId) {
            console.error("SERVER-ERROR: Missing required parameter 'UserId'.");
            return res.status(400).send("Bad Request: 'UserId' is required.");
        }
        
        // Create an SQL query with a prepared parameter
        const query = 'SELECT * FROM users WHERE id = ?';
      
        // Execute the SQL query with the parameter
        connection.query(query, [userId], (err, results) => {
          if (err) {
            console.error('SERVER-ERROR: Failed in request execution', err);
            res.status(500);
            return res.send({ error: 'An error occurred while retrieving user details.' });
          }
      
          // If the query executed successfully without any errors
          const user = results[0]; 
          console.log("SERVER-DEBUG: user information:");
          console.log(user);
          res.json(user); // Send the new user as a response
        });
    });

    // Update User Information
    router.put('/updateUserInfo', (req, res) => {
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
      
        const query = `UPDATE users SET name = ?, email = ?, profil = ?, status = ?, password = ? WHERE id = ?`;
      
        // Execute the SQL query with the parameters
        connection.query(query, [userName, userEmail, userProfile, userStatus, userPassword, userId], (error, results) => {
          if (error) {
            console.error('SERVER-ERROR: Failed in request execution', error);
            res.status(500);
            return res.send({ error: 'An error occurred while updating the user profile.' });
          }
      
          // Check if the update query affected any rows in the database
          if (results.affectedRows === 0) {
            return res.send({ error: 'User not found' });
          }
      
          res.status(200);
          res.json(userId);
        });
    });

    // Information about chat group participants
    router.get('/ParticipantsInfo', (req, res) => {
        console.log("SERVER-DEBUG: router '/ParticipantsInfo' handler.");

        const groupId = req.query.GroupId;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: group_id <- " + usergroupIdId);

        // Validate required parameters
        if (!groupId) {
            console.error("SERVER-ERROR: Missing required parameter 'GroupId'.");
            return res.status(400).send("Bad Request: 'GroupId' is required.");
        }
      
        const query = 'SELECT participantsId FROM chat_groups WHERE id = ?';
      
        // Execute the SQL query with the parameter
        connection.query(query, [groupId], (err, results) => {
          if (err) {
            console.error('SERVER-ERROR: Failed in request execution', err);
            res.status(500);
            return res.send({ error: 'An error occurred while retrieving participants information.' });
          }
      
          const group = results[0];
          const participantsIdArray = JSON.parse(group.participantsId);
          const participantsIdIntegers = participantsIdArray.map(id => parseInt(id));
      
          console.log("SERVER-DEBUG: participantsId as integers:");
          console.log(participantsIdIntegers);
          res.json({ participantsId: participantsIdIntegers });
        });
    });

    // Route to retrieve all users except the currently logged-in user
    router.get('/AllUsers', (req, res) => {
        console.log("SERVER-DEBUG: router '/AllUsers' handler.");

        const currentUserID = req.query.currentUserID;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: current_user_id <- " + currentUserID);

        // Validate that currentUserID is provided
        if (!currentUserID) {
            console.error("SERVER-ERROR: Missing required parameter 'currentUserID'.");
            return res.status(400).send("Bad Request: 'currentUserID' is required.");
        }

        connection.query('SELECT * FROM users WHERE id != ?', [currentUserID], (err, rows) => {
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
                res.status(500).send('Error retrieving users');
            } 
            
            else {
                res.json(rows);
            }
        });
    });

    // Route GET to retrieve all users and groups except the currently logged-in user
    router.get('/AllUsersAndGroups', (req, res) => {
        console.log("SERVER-DEBUG: router '/AllUsers' handler.");

        const currentUserID = req.query.currentUserID;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: current_user_id <- " + currentUserID);

        // Validate that currentUserID is provided
        if (!currentUserID) {
            console.error("SERVER-ERROR: Missing required parameter 'currentUserID'.");
            return res.status(400).send("Bad Request: 'currentUserID' is required.");
        }
    
        // Make an SQL query to retrieve all users except the currently logged-in user
        connection.query('SELECT * FROM users WHERE id != ?', [currentUserID], (err, rows) => { 
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
                res.status(500).send('Error retrieving users');
            } 
            
            else {
                // Retrieve groups from the database that contain the currentUser's id in the participantsId list
                connection.query('SELECT * FROM chat_groups WHERE JSON_CONTAINS(participantsId, ?)', [currentUserID], (err, groupRows) => {  
                    if (err) {
                        console.error('SERVER-ERROR: Failed executing the query:', err);
                        res.status(500).send('Error retrieving groups');
                    } 
                    
                    else {
                        // Combine the filtered group list with the list of users retrieved from the database
                        const combinedData = [...rows, ...groupRows];
                        res.json(combinedData);
                    }
                });
            }
        });
    });

    return router;
};