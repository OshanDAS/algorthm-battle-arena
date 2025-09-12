\# AlgorithmBattleArena API Reference



\## Authentication



\### Register Student

```http

POST /api/Auth/register/student

```

```json

{

&nbsp; "email": "string",

&nbsp; "password": "string",

&nbsp; "passwordConfirm": "string",

&nbsp; "firstName": "string",

&nbsp; "lastName": "string",

&nbsp; "teacherId": 0,

&nbsp; "role": "string"

}

```



\### Register Teacher

```http

POST /api/Auth/register/teacher

```

```json

{

&nbsp; "email": "string",

&nbsp; "password": "string",

&nbsp; "passwordConfirm": "string",

&nbsp; "firstName": "string",

&nbsp; "lastName": "string",

&nbsp; "role": "string"

}

```



\### Login

```http

POST /api/Auth/login

```

```json

{

&nbsp; "email": "string",

&nbsp; "password": "string"

}

```



\### Refresh Token

```http

GET /api/Auth/refresh/token

```



\### Get Profile

```http

GET /api/Auth/profile

```



\## Problems



\### Create or Update Problem

```http

POST /api/Problems/UpsertProblem

```

```json

{

&nbsp; "title": "string",

&nbsp; "description": "string",

&nbsp; "difficultyLevel": "string",

&nbsp; "category": "string",

&nbsp; "timeLimit": 0,

&nbsp; "memoryLimit": 0,

&nbsp; "createdBy": "string",

&nbsp; "tags": "string",

&nbsp; "testCases": "string",

&nbsp; "solutions": "string"

}

```



\### Get Problems

```http

GET /api/Problems

```

\*\*Query Parameters:\*\*

\- Category (string)

\- DifficultyLevel (string)

\- SearchTerm (string)

\- Page (integer)

\- PageSize (integer)



\### Get Problem by ID

```http

GET /api/Problems/{id}

```



\### Delete Problem

```http

DELETE /api/Problems/{id}

```



\### Get Categories

```http

GET /api/Problems/categories

```



\### Get Difficulty Levels

```http

GET /api/Problems/difficulty-levels

```

