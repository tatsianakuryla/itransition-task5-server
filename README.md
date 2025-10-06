# API Documentation for Frontend Developers

## Table of Contents

- [Basic Information](#basic-information)
- [Authentication](#authentication)
  - [Using Tokens](#using-tokens)
- [Endpoints](#endpoints)
  - [1. User Registration](#1-user-registration)
  - [2. User Login](#2-user-login)
  - [3. Refresh Token](#3-refresh-token)
  - [4. Logout](#4-logout)
  - [5. Account Activation](#5-account-activation)
  - [6. Get Users List](#6-get-users-list)
  - [7. Delete Users](#7-delete-users)
  - [8. Delete Unverified Users](#8-delete-unverified-users)
  - [9. Update Users Status](#9-update-users-status)
  - [10. Server Health Check](#10-server-health-check)
- [Data Types](#data-types)
  - [User Object](#user-object)
  - [Status Enum](#status-enum)
- [Error Handling](#error-handling)
  - [HTTP Status Codes](#http-status-codes)

---

## Basic Information

**Base URL:** `backend--itransition-task5-server--kfjltdjcwqvn.code.run`

**Content-Type:** `application/json`

All requests and responses use JSON format.

---
## Authentication

The API uses JWT tokens for authentication:
- **Access Token** - short-lived token for accessing protected endpoints
- **Refresh Token** - long-lived token for refreshing access tokens

### Using Tokens

For protected endpoints, add the header:
```
Authorization: Bearer <access_token>
```

---
## Endpoints

### 1. User Registration

**POST** `/users/register`

Registers a new user and sends an activation email.

#### Request Body:
```text
{
  "name": "string",      // Required
  "email": "string",     // Required, valid email format
  "password": "string"   // Required
}
```

#### Success Response (201):
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "status": "UNVERIFIED",
    "registrationTime": "2025-10-06T17:51:58.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Registration successful. Please check your email to activate your account."
}
```

#### Error Responses:
- **409 Conflict:**
```json
{
  "error": "User with such an email already exists"
}
```
- **400 Bad Request:** 
```json
{
    "error": "Validation error",
    "issues": "Some issue"
}
```
- **500 Internal Server Error:**
```json
{
    "error": "Server error"
}
```

---

### 2. User Login

**POST** `/users/login`

Authenticates a user and returns tokens.

#### Request Body:
```text
{
  "email": "string",     // Required, valid email format
  "password": "string"   // Required
}
```

#### Success Response (200):
```json
{
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "ACTIVE"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses:
- **401 Unauthorized:**
```json
{
  "error": "Invalid email or password"
}
```
- **403 Forbidden:**
```json
{
  "error": "The user is blocked"
}
```
- **400 Bad Request:** 
```json
{
"error": "Invalid data"
}
```
- **500 Internal Server Error:**
```json
{
"error": "Server error"
}
```
---

### 3. Refresh Token

**POST** `/users/refresh`

Refreshes the access token using a refresh token.

#### Request Body:
```text
{
  "refreshToken": "string"  // Required
}
```

#### Success Response (200):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Responses:
- **400 Bad Request:**
```json
{
  "error": "Refresh token is required"
}
```
- **401 Unauthorized:**
```json
{
  "error": "Invalid or revoked refresh token"
}
```
or
```json
{
  "error": "Invalid refresh token"
}
```

---

### 4. Logout

**POST** `/users/logout`

🔒 **Authentication Required**

Revokes the refresh token and ends the session.

#### Headers:
```
Authorization: Bearer <access_token>
```

#### Request Body:
```text
{
  "refreshToken": "string"  // Required
}
```

#### Success Response (204):
Empty response (No Content)

#### Error Responses:
- **400 Bad Request:**
```json
{
  "error": "Refresh token is required"
}
```
- **401 Unauthorized:** 
```json
{
  "error": "Invalid or missing access token"
}
```
---

### 5. Account Activation

**GET** `/users/activate/:token`

Activates a user account using the token from email. This endpoint is called automatically when clicking the link in the activation email.

#### URL Parameters:
- `token` - activation token from email

#### Success Response:
Redirects to: `{FRONTEND_URL}/activation-success`

#### Error Response:
Redirects to: `{FRONTEND_URL}/activation-failed?error={error_message}`

---

### 6. Get Users List

**GET** `/users/`

🔒 **Authentication Required**

Returns a list of all users with optional sorting.

#### Headers:
```
Authorization: Bearer <access_token>
```

#### Query Parameters (Optional):
- `sortBy` - Field to sort by. Options: `name`, `email`, `status`, `registrationTime`. Default: `registrationTime`
- `order` - Sort order. Options: `asc`, `desc`. Default: `desc`

#### Examples:
- `/users/` - Get all users sorted by registration time (newest first)
- `/users/?sortBy=name&order=asc` - Sort by name alphabetically
- `/users/?sortBy=email&order=desc` - Sort by email (Z to A)
- `/users/?sortBy=status&order=asc` - Sort by status

#### Success Response (200):
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "status": "ACTIVE",
    "registrationTime": "2025-10-06T17:51:58.000Z"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "status": "BLOCKED",
    "registrationTime": "2025-10-05T12:30:00.000Z"
  }
]
```

#### Error Responses:
- **401 Unauthorized:** 

```json
{
  "error": "Invalid or missing access token"
}
``` 
- **500 Internal Server Error:**
```json
{
"error": "Server error"
}
```

---

### 7. Delete Users

**DELETE** `/users/`

🔒 **Authentication Required**

Deletes multiple users by their IDs.

#### Headers:
```
Authorization: Bearer <access_token>
```

#### Request Body:
```text
{
  "ids": [1, 2, 3]  // Array of IDs, minimum 1, all IDs must be unique
}
```

#### Success Response (200):
```json
{
  "message": "Successfully deleted",
  "count": 3
}
```

#### Error Responses:
- **400 Bad Request:**
```json
{
"error": "Invalid data (empty array, duplicate IDs, invalid IDs)"
}
```
- **401 Unauthorized:**
```json
  {
  "error": "Invalid or missing access token"
  }
```
- **500 Internal Server Error:**
```json
{
"error": "Server error"
}
```
---

### 8. Delete Unverified Users

**DELETE** `/users/unverified`

🔒 **Authentication Required**

Deletes all users with "UNVERIFIED" status.

#### Headers:
```
Authorization: Bearer <access_token>
```

#### Success Response (200):
```json
{
  "message": "Successfully deleted",
  "count": 5
}
```

#### Error Responses:
- **401 Unauthorized:**
```json
  {
  "error": "Invalid or missing access token"
  }
```
- **500 Internal Server Error:**
```json
{
"error": "Server error"
}
```

---

### 9. Update Users Status

**PATCH** `/users/`

🔒 **Authentication Required**

Updates the status of multiple users.

#### Headers:
```
Authorization: Bearer <access_token>
```

#### Request Body:
```text
{
  "ids": [1, 2, 3],  // Array of IDs, minimum 1, all IDs must be unique
  "status": "BLOCKED" // One of: "ACTIVE", "BLOCKED", "UNVERIFIED"
}
```

#### Success Response (200):
```json
{
  "message": "Successfully updated",
  "count": 3
}
```

#### Error Responses:
- **400 Bad Request:**
```json
{
"error": "Invalid data (empty array, duplicate IDs, invalid IDs)"
}
```
- **401 Unauthorized:**
```json
  {
  "error": "Invalid or missing access token"
  }
```
- **500 Internal Server Error:**
```json
{
"error": "Server error"
}
```

---

### 10. Server Health Check

**GET** `/`

Check if the server is running.

#### Success Response (200):
```json
{
  "status": "ok"
}
```

---

## Data Types

### User Object
```text
{
  id: number,
  name: string,
  email: string,
  status: "ACTIVE" | "BLOCKED" | "UNVERIFIED",
  registrationTime: string (ISO 8601 datetime)
}
```

### Status Enum
- `ACTIVE` - active user
- `BLOCKED` - blocked user
- `UNVERIFIED` - unverified user (hasn't confirmed email)

---

## Error Handling

All errors are returned in the format:
```json
{
  "error": "Error description"
}
```

### HTTP Status Codes:
- **200 OK** - successful request
- **201 Created** - resource created
- **204 No Content** - successful request with no response body
- **400 Bad Request** - invalid data in request
- **401 Unauthorized** - authentication required or token is invalid
- **403 Forbidden** - access denied (e.g., user is blocked)
- **409 Conflict** - data conflict (e.g., email already exists)
- **500 Internal Server Error** - server error

---