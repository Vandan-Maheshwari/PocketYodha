-- CREATE DATABASE
CREATE DATABASE pocket_yodha;
USE pocket_yodha;

-- =========================
-- 1. USERS TABLE
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('student','young_adult') NOT NULL,
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    hp INT DEFAULT 100,
    balance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 2. SETTINGS TABLE
-- =========================
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    monthly_budget DECIMAL(10,2),
    daily_limit DECIMAL(10,2),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- 3. EXPENSES TABLE
-- =========================
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    type ENUM('need','want','trap'),
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- 4. BATTLES TABLE
-- =========================
CREATE TABLE battles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    expense_id INT,
    trigger_reason VARCHAR(255),
    choice_made ENUM('buy','skip'),
    xp_change INT,
    hp_change INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL
);

-- =========================
-- 5. SKILLS TABLE
-- =========================
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    skill_name VARCHAR(100),
    level INT DEFAULT 1,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- 6. GOALS TABLE
-- =========================
CREATE TABLE goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    target_amount DECIMAL(10,2),
    saved_amount DECIMAL(10,2) DEFAULT 0,
    deadline DATE,
    status ENUM('active','completed','failed') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- 7. ACTIVITY LOG TABLE
-- =========================
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(100),
    reference_id INT,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- 8. REWARDS TABLE
-- =========================
CREATE TABLE rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    reward_type VARCHAR(100),
    reward_name VARCHAR(100),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);