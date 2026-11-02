-- =====================================================================
--  Aura — Emotionally Intelligent AI Companion
--  Database schema (MariaDB 10.4+ / MySQL 8.0+)
--
--  Usage:
--    mysql -u root -p < database/schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS aura_chat
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aura_chat;

-- ---------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name           VARCHAR(80)   NOT NULL,
  email          VARCHAR(190)  NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,
  avatar         VARCHAR(16)   NOT NULL DEFAULT '',  -- emoji; default set by the API
  theme          ENUM('system','light','dark') NOT NULL DEFAULT 'system',
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Auth tokens (only a SHA-256 hash of each token is stored)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_tokens (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  CHAR(64)     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tokens_hash (token_hash),
  KEY idx_tokens_user (user_id),
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  title         VARCHAR(120) NOT NULL DEFAULT 'New conversation',
  last_emotion  VARCHAR(20)  NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_conv_user_updated (user_id, updated_at),
  CONSTRAINT fk_conv_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id    INT UNSIGNED NOT NULL,
  role               ENUM('user','assistant') NOT NULL,
  content            TEXT         NOT NULL,
  emotion            VARCHAR(20)  NULL,       -- detected emotion (user messages)
  emotion_intensity  TINYINT UNSIGNED NULL,   -- 1..5
  source             VARCHAR(20)  NULL,       -- 'gemini' | 'offline' (assistant messages)
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_msg_conv (conversation_id, id),
  CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Daily mood tracker (one entry per user per day)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mood_entries (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  mood        VARCHAR(20)  NOT NULL,
  intensity   TINYINT UNSIGNED NOT NULL DEFAULT 3,  -- 1..5
  note        VARCHAR(500) NULL,
  entry_date  DATE         NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mood_user_day (user_id, entry_date),
  CONSTRAINT fk_mood_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
