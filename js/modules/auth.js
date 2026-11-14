// =====================================
// SHOPORA - AUTHENTICATION
// =====================================

import { saveData, getData } from "./storage.js";
import { adminAccount, initialUsers } from "../data/users.js";


// =====================================
// Initialize Users
// =====================================

export function initializeUsers() {

    const users = getData("users", null);

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

    const existingUser = users.find(
        user => user.email.toLowerCase() === email
    );

    if (existingUser) {

        return {
            success: false,
            message: "This email is already registered!"
        };

    }

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

    const currentUser = {

        id: user.id,

        name: user.name,

        email: user.email,

        role: user.role

    };

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

    const user = getCurrentUser();

    if (!user || !user.id) {

        return false;

    }

    const users = getData("users", []);

    return users.some(storedUser =>

        String(storedUser.id) === String(user.id) &&
        storedUser.email === user.email

    );

}


// =====================================
// Check Admin Permission
// =====================================

export function isAdmin() {

    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.id) {

        return false;

    }

    const users = getData("users", []);

    const storedUser = users.find(user =>

        String(user.id) === String(currentUser.id) &&
        user.email === currentUser.email

    );

    return storedUser !== undefined &&
           storedUser.role === "admin" &&
           currentUser.role === "admin";

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

    if (!isLoggedIn()) {

        return false;

    }

    name = name.trim();

    if (!name) {

        return false;

    }

    const users = getData("users", []);

    const userIndex = users.findIndex(

        user => String(user.id) === String(currentUser.id)

    );

    if (userIndex === -1) {

        return false;

    }

    users[userIndex].name = name;

    if (newPassword.trim() !== "") {

        if (newPassword.length < 6) {

            return false;

        }

        users[userIndex].password = newPassword;

    }

    const saved = saveData("users", users);

    if (!saved) {

        return false;

    }

    currentUser.name = name;

    const sessionSaved = saveData("currentUser", currentUser);

    if (!sessionSaved) {

        return false;

    }

    return true;

}