# AlgorithmBattleArena API Reference

## Authentication

### Register Student

**Endpoint**

```
POST /api/Auth/register/student
```

**Request Body**

```json
{
  "email": "string",
  "password": "string",
  "passwordConfirm": "string",
  "firstName": "string",
  "lastName": "string",
  "teacherId": 0,
  "role": "string"
}
```

### Register Teacher

**Endpoint**

```
POST /api/Auth/register/teacher
```

**Request Body**

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

### Login

**Endpoint**

```
POST /api/Auth/login
```

**Request Body**

```json
{
  "email": "string",
  "password": "string"
}
```

### Refresh Token

**Endpoint**

```
GET /api/Auth/refresh/token
```

### Get Profile

**Endpoint**

```
GET /api/Auth/profile
```

## Problems

### Create or Update Problem

**Endpoint**

```
POST /api/Problems/UpsertProblem
```

**Request Body**

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

### Get Problems

**Endpoint**

```
GET /api/Problems
```

**Query Parameters**

- **Category**: string
- **DifficultyLevel**: string
- **SearchTerm**: string
- **Page**: integer
- **PageSize**: integer

### Get Problem by ID

**Endpoint**

```
GET /api/Problems/{id}
```

### Delete Problem

**Endpoint**

```
DELETE /api/Problems/{id}
```

### Get Categories

**Endpoint**

```
GET /api/Problems/categories
```

### Get Difficulty Levels

**Endpoint**

```
GET /api/Problems/difficulty-levels
```