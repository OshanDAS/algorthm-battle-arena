# AlgorithmBattleArena API Reference

## Authentication

### Register Student

**Endpoint:** `POST /api/Auth/register/student`  
**Authorization:** None (Anonymous)

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "passwordConfirm": "string",
  "firstName": "string",
  "lastName": "string",
  "teacherId": NULL,
  "role": "string"
}
```

**Response:** `200 OK`
```json
{
  "message": "Student registered successfully"
}
```

### Register Teacher

**Endpoint:** `POST /api/Auth/register/teacher`  
**Authorization:** None (Anonymous)

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "passwordConfirm": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string"
}
```

**Response:** `200 OK`
```json
{
  "message": "Teacher registered successfully"
}
```

### Login

**Endpoint:** `POST /api/Auth/login`  
**Authorization:** None (Anonymous)

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "token": "string",
  "role": "string",
  "email": "string"
}
```

### Refresh Token

**Endpoint:** `GET /api/Auth/refresh/token`  
**Authorization:** Bearer Token Required

**Response:** `200 OK`
```json
{
  "token": "string",
  "role": "string",
  "email": "string"
}
```

### Get Profile

**Endpoint:** `GET /api/Auth/profile`  
**Authorization:** Bearer Token Required

**Response:** `200 OK`
```json
{
  "id": 0,
  "firstName": "string",
  "lastName": "string",
  "fullName": "string",
  "email": "string",
  "role": "string",
  "active": true,
  "teacherId": 0
}
```

## Lobbies

### Get Open Lobbies

**Endpoint:** `GET /api/Lobbies`  
**Authorization:** Student or Admin

**Response:** `200 OK`
```json
[
  {
    "lobbyId": 0,
    "name": "string",
    "maxPlayers": 0,
    "currentPlayers": 0,
    "status": "string",
    "hostEmail": "string",
    "lobbyCode": "string"
  }
]
```

### Get Lobby by ID

**Endpoint:** `GET /api/Lobbies/{lobbyId}`  
**Authorization:** Student or Admin

**Response:** `200 OK`
```json
{
  "lobbyId": 0,
  "name": "string",
  "maxPlayers": 0,
  "currentPlayers": 0,
  "status": "string",
  "hostEmail": "string",
  "lobbyCode": "string"
}
```

### Create Lobby

**Endpoint:** `POST /api/Lobbies`  
**Authorization:** Student or Admin

**Request Body:**
```json
{
  "name": "string",
  "maxPlayers": 10,
  "mode": "1v1",
  "difficulty": "Medium"
}
```

**Response:** `201 Created`
```json
{
  "lobbyId": 0,
  "name": "string",
  "maxPlayers": 0,
  "status": "string",
  "hostEmail": "string",
  "lobbyCode": "string"
}
```

### Join Lobby

**Endpoint:** `POST /api/Lobbies/{lobbyCode}/join`  
**Authorization:** Student or Admin

**Response:** `200 OK`
```json
{
  "lobbyId": 0,
  "name": "string",
  "currentPlayers": 0,
  "maxPlayers": 0
}
```

### Leave Lobby

**Endpoint:** `POST /api/Lobbies/{lobbyId}/leave`  
**Authorization:** Student or Admin

**Response:** `200 OK`
```json
{
  "message": "Left lobby successfully"
}
```

### Close Lobby

**Endpoint:** `POST /api/Lobbies/{lobbyId}/close`  
**Authorization:** Host Only

**Response:** `200 OK`
```json
{
  "message": "Lobby closed successfully"
}
```

### Kick Participant

**Endpoint:** `DELETE /api/Lobbies/{lobbyId}/participants/{participantEmail}`  
**Authorization:** Host Only

**Response:** `200 OK`
```json
{
  "message": "Participant kicked successfully"
}
```

### Update Lobby Privacy

**Endpoint:** `PUT /api/Lobbies/{lobbyId}/privacy`  
**Authorization:** Host Only

**Request Body:**
```json
{
  "isPublic": true
}
```

**Response:** `200 OK`
```json
{
  "message": "Lobby privacy updated successfully"
}
```

### Update Lobby Difficulty

**Endpoint:** `PUT /api/Lobbies/{lobbyId}/difficulty`  
**Authorization:** Host Only

**Request Body:**
```json
{
  "difficulty": "Hard"
}
```

**Response:** `200 OK`
```json
{
  "message": "Lobby difficulty updated successfully"
}
```

### Delete Lobby

**Endpoint:** `DELETE /api/Lobbies/{lobbyId}`  
**Authorization:** Host Only

**Response:** `200 OK`
```json
{
  "message": "Lobby deleted successfully"
}
```

## Matches

### Start Match

**Endpoint:** `POST /api/Matches/{lobbyId}/start`  
**Authorization:** Host Only

**Request Body:**
```json
{
  "problemIds": [1, 2, 3],
  "durationSec": 3600,
  "preparationBufferSec": 5
}
```

**Response:** `200 OK`
```json
{
  "matchId": 0,
  "problemIds": [1, 2, 3],
  "startAtUtc": "2024-01-01T00:00:00Z",
  "durationSec": 3600,
  "sentAtUtc": "2024-01-01T00:00:00Z"
}
```

## Problems

### Create or Update Problem

**Endpoint:** `POST /api/Problems/UpsertProblem`  
**Authorization:** Admin Only

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "difficultyLevel": "string",
  "category": "string",
  "timeLimit": 0,
  "memoryLimit": 0,
  "createdBy": "string",
  "tags": "string",
  "testCases": "string",
  "solutions": "string"
}
```

**Response:** `200 OK`
```json
{
  "message": "Problem upserted successfully.",
  "problemId": 0
}
```

### Get Problems

**Endpoint:** `GET /api/Problems`  
**Authorization:** Student or Admin

**Query Parameters:**
- `Category` (string, optional)
- `DifficultyLevel` (string, optional)
- `SearchTerm` (string, optional)
- `Page` (integer, optional)
- `PageSize` (integer, optional)

**Response:** `200 OK`
```json
{
  "problems": [],
  "page": 1,
  "pageSize": 10,
  "total": 0
}
```

### Get Problem by ID

**Endpoint:** `GET /api/Problems/{id}`  
**Authorization:** Student or Admin

**Response:** `200 OK`
```json
{
  "problemId": 0,
  "title": "string",
  "description": "string",
  "difficultyLevel": "string",
  "category": "string",
  "timeLimit": 0,
  "memoryLimit": 0
}
```

### Delete Problem

**Endpoint:** `DELETE /api/Problems/{id}`  
**Authorization:** Admin Only

**Response:** `200 OK`
```json
{
  "message": "Problem deleted successfully."
}
```

### Get Categories

**Endpoint:** `GET /api/Problems/categories`  
**Authorization:** Student or Admin

**Response:** `200 OK`
```json
["Array", "String", "Dynamic Programming", "Graph"]
```

### Get Difficulty Levels

**Endpoint:** `GET /api/Problems/difficulty-levels`  
**Authorization:** Student or Admin

**Response:** `200 OK`
```json
["Easy", "Medium", "Hard", "Expert"]
```

### Generate Problems

**Endpoint:** `POST /api/Problems/generate`  
**Authorization:** Bearer Token Required

**Request Body:**
```json
{
  "language": "string",
  "difficulty": "string",
  "maxProblems": 5
}
```

**Response:** `200 OK`
```json
[
  {
    "problemId": 0,
    "title": "string",
    "description": "string",
    "difficultyLevel": "string"
  }
]
```

## Submissions

### Create Submission

**Endpoint:** `POST /api/Submissions`  
**Authorization:** Bearer Token Required

**Request Body:**
```json
{
  "matchId": 0,
  "problemId": 0,
  "language": "string",
  "code": "string"
}
```

**Response:** `200 OK`
```json
{
  "submissionId": 0
}
```

## SignalR Hub

### Hub Endpoint

**URL:** `/lobbyHub` or `/matchHub`  
**Authorization:** Bearer Token Required

### Hub Methods

#### Join Lobby
**Method:** `JoinLobby(string lobbyId)`

#### Leave Lobby
**Method:** `LeaveLobby(string lobbyId)`

### Hub Events (Server to Client)

#### Lobby Updated
**Event:** `LobbyUpdated`
```json
{
  "lobbyId": 0,
  "name": "string",
  "currentPlayers": 0,
  "maxPlayers": 0,
  "status": "string"
}
```

#### Lobby Created
**Event:** `LobbyCreated`
```json
{
  "lobbyId": 0,
  "name": "string",
  "hostEmail": "string",
  "lobbyCode": "string"
}
```

#### Lobby Deleted
**Event:** `LobbyDeleted`

#### Match Started
**Event:** `MatchStarted`
```json
{
  "matchId": 0,
  "problemIds": [1, 2, 3],
  "startAtUtc": "2024-01-01T00:00:00Z",
  "durationSec": 3600,
  "sentAtUtc": "2024-01-01T00:00:00Z"
}
```

## Authorization Levels

- **Anonymous:** No authentication required
- **Bearer Token Required:** Valid JWT token required
- **Student or Admin:** Student or Admin role required
- **Admin Only:** Admin role required
- **Host Only:** Must be the lobby host

## Error Responses

### 400 Bad Request
```json
{
  "message": "Error description"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid credentials" 
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error: [details]"
}
```