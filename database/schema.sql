-- Create database if not exists
CREATE DATABASE IF NOT EXISTS college_course_reg;
USE college_course_reg;

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS waitlist;
DROP TABLE IF EXISTS completed_courses;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- Create students table
CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar MEDIUMTEXT, -- base64 image data URI
    current_semester INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create courses table
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    department VARCHAR(100) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0),
    instructor VARCHAR(100) NOT NULL,
    capacity INT NOT NULL CHECK (capacity >= 0),
    enrolled_count INT DEFAULT 0,
    semester INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_enrolled_limit CHECK (enrolled_count <= capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create enrollments table
CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_course (student_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create completed_courses table for semester history & GPA calculations
CREATE TABLE completed_courses (
    completed_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    title VARCHAR(150) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0),
    grade VARCHAR(2) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create waitlist table for waiting queue
CREATE TABLE waitlist (
    waitlist_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_waitlist (student_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert seed data for courses
INSERT INTO courses (course_code, title, description, department, credits, instructor, capacity, enrolled_count) VALUES
('CS-101', 'Introduction to Computer Science', 'An introduction to programming methodology and problem solving using Python. Topics include loops, functions, lists, and basic data structures.', 'Computer Science', 4, 'Dr. Alan Turing', 30, 0),
('CS-201', 'Data Structures and Algorithms', 'Study of fundamental data structures (lists, stacks, queues, trees, graphs) and algorithms for sorting, searching, and graph analysis.', 'Computer Science', 4, 'Dr. Grace Hopper', 25, 0),
('CS-301', 'Database Management Systems', 'Core concepts of database design, entity-relationship modeling, relational algebra, SQL, database normalization, and transaction management.', 'Computer Science', 4, 'Dr. Edgar Codd', 20, 0),
('CS-401', 'Artificial Intelligence', 'Introduction to search techniques, knowledge representation, machine learning, neural networks, and natural language processing.', 'Computer Science', 4, 'Dr. Yann LeCun', 15, 0),
('CS-202', 'Systems Programming', 'Introduction to low-level programming with C and assembly language, process control, signals, and network programming.', 'Computer Science', 4, 'Dr. Dennis Ritchie', 25, 0),
('CS-303', 'Operating Systems', 'Process management, memory management, file systems, device management, security, and distributed systems.', 'Computer Science', 4, 'Dr. Ken Thompson', 20, 20),
('AIML-201', 'Introduction to Machine Learning', 'Supervised and unsupervised learning, regression, classification, clustering, dimensionality reduction, and model evaluation.', 'Artificial Intelligence', 4, 'Dr. Andrew Ng', 30, 0),
('AIML-302', 'Deep Learning', 'Neural networks, convolutional neural networks, recurrent neural networks, transformers, generative models, and optimization.', 'Artificial Intelligence', 4, 'Dr. Geoffrey Hinton', 15, 15),
('CE-101', 'Surveying', 'Principles of measurement, leveling, traversing, topographic mapping, and GPS positioning.', 'Civil Engineering', 3, 'Dr. Vitruvius', 30, 0),
('CE-201', 'Strength of Materials', 'Analysis of stress, strain, axial loads, torsion, bending, and shear in structural components.', 'Civil Engineering', 4, 'Dr. Stephen Timoshenko', 25, 0),
('ME-101', 'Thermodynamics', 'First and second laws of thermodynamics, properties of pure substances, entropy, and thermodynamic cycles.', 'Mechanical Engineering', 3, 'Dr. James Joule', 35, 0),
('ME-202', 'Fluid Mechanics', 'Fluid properties, statics, dynamics, Bernoulli equation, control volume analysis, and viscous flow in pipes.', 'Mechanical Engineering', 4, 'Dr. Osborne Reynolds', 25, 0),
('MATH-101', 'Calculus I', 'Limits, continuity, derivatives, optimization problems, and basic integration with applications to physical sciences.', 'Mathematics', 3, 'Dr. Isaac Newton', 40, 0),
('MATH-201', 'Linear Algebra', 'Systems of linear equations, matrices, determinants, vector spaces, linear transformations, eigenvalues, and eigenvectors.', 'Mathematics', 3, 'Dr. Carl Gauss', 35, 0),
('PHYS-101', 'General Physics I', 'Introduction to classical mechanics, including kinematics, Newton\'s laws, work and energy, rotational motion, and gravitation.', 'Physics', 4, 'Dr. Albert Einstein', 30, 0),
('PHYS-101L', 'General Physics I Laboratory', 'Experiments demonstrating conservation of energy, rotational inertia, momentum, and gravitation.', 'Physics', 1, 'Dr. Marie Curie', 30, 0),
('CS-201L', 'Data Structures Lab', 'Practical implementation of stacks, queues, trees, and sorting algorithms in C++.', 'Computer Science', 1, 'Dr. Grace Hopper', 25, 0),
('CS-301L', 'Database Management Systems Lab', 'Hands-on practice with SQL queries, normalization, transactions, and indexing.', 'Computer Science', 1, 'Dr. Edgar Codd', 20, 0),
('CS-EL1', 'Web Development Frameworks Elective', 'Modern web stack development using Node.js, Express, React, and RESTful APIs.', 'Computer Science', 3, 'Dr. Tim Berners-Lee', 30, 0),
('CS-EL2', 'Cloud Computing Concepts Elective', 'Virtualization, cloud architectures, map-reduce programming model, and AWS deployments.', 'Computer Science', 3, 'Dr. Werner Vogels', 25, 0),
('AIML-302L', 'Deep Learning Lab', 'TensorFlow/PyTorch implementations of deep neural nets, CNNs, RNNs, and Transformers.', 'Artificial Intelligence', 1, 'Dr. Geoffrey Hinton', 15, 0),
('AIML-EL1', 'Computer Vision Elective', 'Image processing, feature detection, object recognition, and neural network visual systems.', 'Artificial Intelligence', 3, 'Dr. Fei-Fei Li', 25, 0),
('AIML-EL2', 'Natural Language Processing Elective', 'Tokenization, syntax trees, sequence-to-sequence models, transformers, and LLM fine-tuning.', 'Artificial Intelligence', 3, 'Dr. Christopher Manning', 20, 0);
