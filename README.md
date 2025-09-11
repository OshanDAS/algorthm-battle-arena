# Algorithm Battle Arena 

A **real-time competitive coding platform** built with modern .NET and web technologies.  
Players face off head-to-head, solving algorithm problems while **live leaderboards** update in real-time.  

---

##  Features  

-  **User Authentication & Profiles** – secure login and player stats  
-  **Problem Library (CRUD)** – manage algorithm challenges  
-  **Real-Time Matchmaking & Contests** – powered by SignalR  
-  **Live Leaderboards** – optimized with Dapper queries  
-  **Admin Dashboard** – analytics and system insights  

---


## 🛠 Tech Stack  

**Backend:**  
- ASP.NET Core 8 (Web API + SignalR)  
- Entity Framework Core (MySQL)  
- Dapper (optimized queries)  

**Frontend:**  
- React or Razor Pages  

**Database:**  
- MSSQL  

**CI/CD & Deployment:**  
- GitHub Actions  
- Docker  

**Testing:**  
- xUnit (unit & integration tests)  
- Selenium (end-to-end testing)  

---

##  Getting Started  

### Prerequisites  
- [.NET 8 SDK](https://dotnet.microsoft.com/)  
- [Node.js](https://nodejs.org/) (if using React frontend)  
- [MySQL 8](https://dev.mysql.com/)  
- [Docker](https://www.docker.com/) (for containerized setup)  

### Setup  

```bash
# Clone repo
git clone https://github.com/yourusername/algorithm-battle-arena.git
cd algorithm-battle-arena

# Backend setup
cd src/Backend
dotnet restore
dotnet ef database update
dotnet run

# Frontend setup (if using React)
cd src/Frontend
npm install
npm start
