-- ============================================
-- Script d'initialisation de la base de données
-- Système de Gestion des Réclamations Clients
-- ============================================

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS reclamations_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE reclamations_db;

-- ============================================
-- Table : users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('client', 'agent', 'admin') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- Table : reclamations
-- ============================================
CREATE TABLE IF NOT EXISTS reclamations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('normale', 'urgente') DEFAULT 'normale',
    status ENUM('ouverte', 'en_cours', 'traitée') DEFAULT 'ouverte',
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Table : responses
-- ============================================
CREATE TABLE IF NOT EXISTS responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    reclamation_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reclamation_id) REFERENCES reclamations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Données de test (optionnel)
-- ============================================
-- INSERT INTO users (name, email, password, role) VALUES
-- ('Admin', 'admin@test.com', '$2a$10$...', 'admin'),
-- ('Agent Test', 'agent@test.com', '$2a$10$...', 'agent'),
-- ('Client Test', 'client@test.com', '$2a$10$...', 'client');
