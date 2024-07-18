const fs = require('fs');
const mysql = require('mysql2');
const path = require('path');

// Read the database configuration from config.json
const configFilePath = path.join(__dirname, '..', 'config.json');
const configData = fs.readFileSync(configFilePath, 'utf-8');
const dbConfig = JSON.parse(configData);

// Create a connection to the database
const con = mysql.createConnection(dbConfig);

// Function to execute an SQL query
function executeQuery(query) {
  return new Promise((resolve, reject) => {
    con.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Function to create the "users" table and insert data from "users.json"
async function setupUsersTable() {
  try {
    const usersFilePath = path.join(__dirname, 'template_generated_json_data', 'users.json');
    const usersData = fs.readFileSync(usersFilePath, 'utf-8');
    const usersArray = JSON.parse(usersData);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(15),
        email VARCHAR(255),
        profil TEXT,
        status VARCHAR(50),
        password VARCHAR(255)
      )
    `);

    // Clear existing data
    await executeQuery(`TRUNCATE TABLE users`);

    for (const user of usersArray) {
      const { id, name, phone, email, profil, status, password } = user;
      await executeQuery(`
        INSERT INTO users (id, name, phone, email, profil, status, password)
        VALUES (${id}, '${name}', '${phone}', '${email}', '${profil}', '${status}', '${password}')
      `);
    }

    console.log('Users data inserted successfully.');
  } catch (error) {
    console.error('An error occurred while creating "users" table or inserting data:', error);
  }
}

// Function to create the "messages" table and insert data from "messages.json"
async function setupMessagesTable() {
  try {
    const messagesFilePath = path.join(__dirname, 'template_generated_json_data', 'messages.json');
    const messagesData = fs.readFileSync(messagesFilePath, 'utf-8');
    const messagesArray = JSON.parse(messagesData);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender VARCHAR(10),
        receiver VARCHAR(10),
        text TEXT,
        date DATE,
        hour TIME,
        image VARCHAR(255),
        isItRead BOOLEAN,
        isItGroup BOOLEAN,
        modified BOOLEAN,
        reported BOOLEAN,
        readedBy JSON
      )
    `);

    // Clear existing data
    await executeQuery(`TRUNCATE TABLE messages`);

    for (const message of messagesArray) {
      const { id, sender, receiver, text, date, hour, image, isItRead, isItGroup, modified, reported, readedBy } = message;
      const escapedText = text.replace(/'/g, "\\'");
      await executeQuery(`
        INSERT INTO messages (id, sender, receiver, text, date, hour, image, isItRead, isItGroup, modified, reported, readedBy)
        VALUES (${id}, '${sender}', '${receiver}', '${escapedText}', '${date}', '${hour}', '${image}', ${isItRead}, ${isItGroup}, ${modified}, ${reported}, '${JSON.stringify(readedBy)}')
      `);
    }

    console.log('Messages data inserted successfully.');
  } catch (error) {
    console.error('An error occurred while creating "messages" table or inserting data:', error);
  }
}

// Function to create the "chat_groups" table and insert data from "groups.json"
async function setupChatGroupsTable() {
  try {
    const groupsFilePath = path.join(__dirname, 'template_generated_json_data', 'groups.json');
    const groupsData = fs.readFileSync(groupsFilePath, 'utf-8');
    const groupsArray = JSON.parse(groupsData);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS chat_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        adminId INT,
        participantsId JSON,
        title VARCHAR(255),
        profil VARCHAR(255),
        description TEXT
      )
    `);

    // Clear existing data
    await executeQuery(`TRUNCATE TABLE chat_groups`);

    for (const group of groupsArray) {
      const { id, adminId, participantsId, title, profil, description } = group;
      await executeQuery(`
        INSERT INTO chat_groups (id, adminId, participantsId, title, profil, description)
        VALUES (${id}, ${adminId}, '${JSON.stringify(participantsId)}', '${title}', '${profil}', '${description}')
      `);
    }

    console.log('Chat groups data inserted successfully.');
  } catch (error) {
    console.error('An error occurred while creating "chat_groups" table or inserting data:', error);
  }
}

// Function to create the "reported_msg" table and insert data from "reported_msg.json"
async function setupReportedMessagesTable() {
  try {
    const reportedMsgFilePath = path.join(__dirname, 'template_generated_json_data', 'reported_msg.json');
    const reportedMsgData = fs.readFileSync(reportedMsgFilePath, 'utf-8');
    const reportedMsgArray = JSON.parse(reportedMsgData);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS reported_msg (
        id INT AUTO_INCREMENT PRIMARY KEY,
        msgId INT,
        sender INT,
        receiver INT,
        text TEXT,
        date DATE,
        hour TIME,
        image VARCHAR(255),
        isItGroup BOOLEAN,
        checked BOOLEAN,
        deleted BOOLEAN
      )
    `);

    // Clear existing data
    await executeQuery(`TRUNCATE TABLE reported_msg`);

    for (const reportedMsg of reportedMsgArray) {
      const { id, msgId, sender, receiver, text, date, hour, image, isItGroup, checked, deleted } = reportedMsg;
      const escapedText = text.replace(/'/g, "\\'");
      await executeQuery(`
        INSERT INTO reported_msg (id, msgId, sender, receiver, text, date, hour, image, isItGroup, checked, deleted)
        VALUES (${id}, ${msgId}, ${sender}, ${receiver}, '${escapedText}', '${date}', '${hour}', '${image}', ${isItGroup}, ${checked}, ${deleted})
      `);
    }

    console.log('Reported messages data inserted successfully.');
  } catch (error) {
    console.error('An error occurred while creating "reported_msg" table or inserting data:', error);
  }
}

// Call the functions to insert data into tables
setupUsersTable();
setupMessagesTable();
setupChatGroupsTable();
setupReportedMessagesTable();