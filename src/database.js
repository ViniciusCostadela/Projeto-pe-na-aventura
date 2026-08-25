const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory, { recursive: true });

const database = new DatabaseSync(path.join(dataDirectory, 'pena-aventura.db'));
database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS destinations (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, location TEXT NOT NULL,
        description TEXT NOT NULL, link TEXT NOT NULL DEFAULT '', vacancies INTEGER NOT NULL CHECK(vacancies >= 0),
        created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, full_name TEXT NOT NULL, email TEXT NOT NULL,
        phone TEXT NOT NULL, destination_id TEXT NOT NULL, destination_title TEXT NOT NULL, created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(destination_id) REFERENCES destinations(id) ON DELETE CASCADE
    ) STRICT;
    CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
        message TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
`);

module.exports = database;
