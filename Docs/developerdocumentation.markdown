## User Story ABA - 3: Basic React Pages - Auth + Problems List

**Story Definition:**
As a player, I want responsive login/register pages and a public problems list so I can authenticate and browse problems.

**Development Summary:**

* React pages implemented: `Login`, `Register`, `ProblemsList` (with pagination).
* Integrated with API authentication endpoints and `localStorage` for JWT token management.
* Problems list displays:

  * Problem title
  * Difficulty
  * Tags
  * Link to problem detail page

**Testing Summary:**

* Unit tests for React components using **Jest** and **React Testing Library (RTL)**.
* End-to-end (E2E) smoke test: login → redirect → problems list.
* Accessibility checks: keyboard navigation, color contrast compliance.

**Acceptance Criteria:**

* Login/Register pages authenticate via backend and redirect to the problems list.
* Problems list renders ≥10 items and supports pagination.
* Client-side validation errors shown for invalid input.

---

## User Story ABA - 9: SignalR Hub - Lobby & MatchStarted Event

**Story Definition:**
As a player, I want real-time lobby behavior and match start broadcasts so all participants begin the match in sync.

**Development Summary:**

* Implemented **SignalR hub** `/hubs/match` with methods:

  * `JoinLobby`
  * `LeaveLobby`
  * `MatchStarted` event broadcast
* Hub payload includes:

  * `matchId`
  * `problemId`
  * `startAt` timestamp
  * `durationSec`
* Hub requires **JWT authentication** and lobby authorization.

**Testing Summary:**

* Integration tests for hub methods using SignalR test client.
* E2E test: multiple clients join lobby → verify `MatchStarted` received.
* Measured broadcast latency in staging environment.

**Acceptance Criteria:**

* Clients in lobby receive `MatchStarted` with identical `startAt`.
* Unauthorized clients are rejected from hub operations.
