## User Story ABA-3: Responsive Auth & Problems List

**Story Definition:**  
As a player, I want responsive login/register pages and a public problems list so I can authenticate and browse problems.

**Technical Implementation:**

- **Frontend:**
  - React pages: `LoginPage`, `RegisterPage`, and `LobbyPage` (problems list with pagination).
  - API integration via `/api/Auth/login`, `/api/Auth/register/student`, `/api/Auth/register/teacher`.
  - JWT token managed in `localStorage` and provided via context (`AuthProvider`).
  - Problems list displays title, difficulty, tags, and links to detail pages.
  - Pagination and filtering handled via API and frontend state.

- **Backend:**
  - Auth endpoints implemented in `AuthController`.
  - Problems endpoints in `ProblemsController`:
    - `GET /api/problems` for list (supports pagination/filtering).
    - `GET /api/problems/{id}` for details.
  - DTOs for problem data and filtering.

**Testing Approach:**

- **Frontend:**
  - Unit tests for React components using Jest and React Testing Library.
  - E2E smoke test: login → redirect → problems list.
  - Accessibility checks for keyboard navigation and color contrast.

- **Backend:**
  - Controller unit tests for authentication and problems endpoints.

**Acceptance Criteria:**

- Login/Register UI authenticates via backend and redirects to problems list.
- Problems list renders at least 10 items and supports pagination.
- Invalid input triggers client-side validation errors.

---

## User Story ABA-9: Real-Time Lobby & Match Start Broadcasts

**Story Definition:**  
As a player, I want real-time lobby behavior and match start broadcasts so all participants begin the match in sync.

**Technical Implementation:**

- **Backend:**
  - SignalR hub `/hubs/match` implemented in `MatchHub`:
    - Methods: `JoinLobby`, `LeaveLobby`, and server broadcast of `MatchStarted`.
    - Payload includes: `matchId`, `problemId`, `startAt` (UTC), `durationSec`.
    - JWT authentication required for hub access.
    - Lobby membership and authorization enforced.
  - REST endpoint `/api/matches/{lobbyId}/start` triggers match start and broadcasts to lobby.

- **Frontend:**
  - SignalR client connects to `/hubs/match` and listens for `MatchStarted`.
  - Lobby UI updates in real-time on member join/leave and match start.

**Testing Approach:**

- Integration tests for hub methods using SignalR test client.
- E2E: multiple clients join lobby and receive `MatchStarted` event.
- Broadcast latency measured in staging.
- Authorization checks for hub operations.

**Acceptance Criteria:**

- All clients in a lobby receive `MatchStarted` with identical `startAt`.
- Unauthorized clients are rejected

---

## **User Story ABA-10: Match Creation & Player Join Flow**

### Story Definition  
As a player, I want to join a specific match and see the current lobby state so I can confirm my participation.

---

### Development Summary

- **Backend (ASP.NET Core + SignalR):**
  - **MatchesController.cs**
    - `POST /api/matches/{id}/join` → join a specific match.
    - Validates authentication, maxPlayers, and prevents duplicates.
    - Returns `MatchLobbyDto` with player list.
  - **MatchHub.cs**
    - Manages SignalR groups per match.
    - `JoinLobby(matchId)`, `LeaveLobby(matchId)`.
    - Broadcasts `LobbyUpdated` when participants change.
  - **LobbyRepository.cs**
    - Adds/removes players from `MatchParticipants` table.
    - Atomic join logic with transactions/locking.
    - Supports in-memory caching with DB fallback.

- **Frontend (React):**
  - `MatchLobbyPage.tsx`:
    - Calls `POST /api/matches/{id}/join`.
    - Subscribes to `LobbyUpdated` SignalR events.
    - Shows updated player list in real-time.
    - Handles errors: 409 (duplicate), 403 (maxPlayers reached).

---

### Testing Summary

- **Unit Tests:**
  - Join/leave correctness.
  - MaxPlayers enforcement.
  - Duplicate join detection.

- **Integration Tests:**
  - Concurrent join requests → DB locks/transactions.
  - SignalR broadcasts reach all clients.

- **E2E Tests:**
  - Player joins via UI → sees updated list.
  - Other connected clients also see real-time updates.

---

### Acceptance Criteria

- `POST /api/matches/{id}/join` returns current lobby state.
- Duplicate joins → **409 Conflict** or idempotent response.
- MaxPlayers enforced → **403 Forbidden** if exceeded.
- All participants see real-time lobby updates.
- Unauthorized users are rejected.
