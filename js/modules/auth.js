// =====================================
// Import Modules
// =====================================

import { saveData, getData } from "./storage.js";
import { adminAccount, initialUsers } from "../data/users.js";


// =====================================
// Initialize Users
// =====================================

export function initializeUsers() {

    const users = getData("users", null);

    // Create initial users if storage is empty
    if (users === null) {

        const allUsers = [adminAccount, ...initialUsers];

        saveData("users", allUsers);

    }

}


// =====================================
// Register New Customer
// =====================================

export function registerCustomer(name, email, password) {

    const users = getData("users", []);

    // Validate input
    name = name.trim();
    email = email.trim().toLowerCase();

    if (!name || !email || !password) {

        return {
            success: false,
            message: "All fields are required!"
        };

    }

    if (password.length < 6) {

        return {
            success: false,
            message: "Password must be at least 6 characters!"
        };

    }

    // Check if email already exists
    const existingUser = users.find(
        user => user.email.toLowerCase() === email
    );

    if (existingUser) {

        return {
            success: false,
            message: "This email is already registered!"
        };

    }

    // Create new customer
    const newUser = {

        id: crypto.randomUUID(),

        name: name,

        email: email,

        password: password,

        role: "customer"

    };

    users.push(newUser);

    const saved = saveData("users", users);

    if (!saved) {

        return {
            success: false,
            message: "Could not create your account!"
        };

    }

    return {

        success: true,

        message: "Account created successfully!",

        user: newUser

    };

}


// =====================================
// Login User
// =====================================

export function loginUser(email, password) {

    const users = getData("users", []);

    email = email.trim().toLowerCase();

    // Find user
    const user = users.find(

        user =>
            user.email.toLowerCase() === email &&
            user.password === password

    );

    if (!user) {

        return {

            success: false,

            message: "Invalid email or password!"

        };

    }

    // Create current session
    const currentUser = {

        id: user.id,

        name: user.name,

        email: user.email,

        role: user.role

    };

    // Save current user
    const saved = saveData("currentUser", currentUser);

    if (!saved) {

        return {

            success: false,

            message: "Could not start your session!"

        };

    }

    return {

        success: true,

        message: "Login successful!",

        user: currentUser

    };

}


// =====================================
// Get Current User
// =====================================

export function getCurrentUser() {

    return getData("currentUser", null);

}


// =====================================
// Check Login Status
// =====================================

export function isLoggedIn() {

    return getCurrentUser() !== null;

}


// =====================================
// Check Admin Permission
// =====================================

export function isAdmin() {

    const user = getCurrentUser();

    return user !== null && user.role === "admin";

}


// =====================================
// Logout User
// =====================================

export function logoutUser() {

    localStorage.removeItem("currentUser");

}


// =====================================
// Update User Profile
// =====================================

export function updateUserProfile(name, newPassword = "") {

    const currentUser = getCurrentUser();

    if (!currentUser) {

        return false;

    }

    name = name.trim();

    if (!name) {

        return false;

    }

    const users = getData("users", []);

    // Find current user by ID
    const userIndex = users.findIndex(

        user => user.id === currentUser.id

    );

    if (userIndex === -1) {

        return false;

    }

    // Update name
    users[userIndex].name = name;

    // Update password only if provided
    if (newPassword.trim() !== "") {

        if (newPassword.length < 6) {

            return false;

        }

        users[userIndex].password = newPassword;

    }

    // Save updated users
    const saved = saveData("users", users);

    if (!saved) {

        return false;

    }

    // Update current session
    currentUser.name = name;

    const sessionSaved = saveData("currentUser", currentUser);

    if (!sessionSaved) {

        return false;

    }

    return true;

}