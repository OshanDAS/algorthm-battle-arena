using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Dtos;

namespace AlgorithmBattleArina.Repositories
{
    public class StatisticsRepository : IStatisticsRepository
    {
        private readonly IDataContextDapper _dapper;

        public StatisticsRepository(IDataContextDapper dapper)
        {
            _dapper = dapper;
        }

        public async Task<UserStatisticsDto> GetUserStatistics(string userEmail)
        {
            var sql = @"
                WITH UserStats AS (
                    SELECT 
                        s.Email,
                        COALESCE(s.FirstName + ' ' + s.LastName, t.FirstName + ' ' + t.LastName, s.Email) as FullName,
                        COUNT(DISTINCT lp.LobbyId) as MatchesPlayed,
                        COUNT(DISTINCT CASE WHEN sub.Status = 'Accepted' THEN sub.ProblemId END) as ProblemsCompleted,
                        COALESCE(AVG(CAST(SUBSTRING(sub.Status, 1, CASE WHEN CHARINDEX('%', sub.Status) > 0 THEN CHARINDEX('%', sub.Status) - 1 ELSE 0 END) AS DECIMAL)), 0) as AvgScore,
                        MAX(sub.SubmittedAt) as LastActivity
                    FROM AlgorithmBattleArinaSchema.Auth a
                    LEFT JOIN AlgorithmBattleArinaSchema.Student s ON a.Email = s.Email
                    LEFT JOIN AlgorithmBattleArinaSchema.Teachers t ON a.Email = t.Email
                    LEFT JOIN AlgorithmBattleArinaSchema.LobbyParticipants lp ON a.Email = lp.ParticipantEmail
                    LEFT JOIN AlgorithmBattleArinaSchema.Lobbies l ON lp.LobbyId = l.LobbyId AND l.Status = 'Closed'
                    LEFT JOIN AlgorithmBattleArinaSchema.Submissions sub ON a.Email = sub.ParticipantEmail
                    WHERE a.Email = @Email
                    GROUP BY s.Email, s.FirstName, s.LastName, t.FirstName, t.LastName
                ),
                Rankings AS (
                    SELECT 
                        Email,
                        ROW_NUMBER() OVER (ORDER BY AvgScore DESC, ProblemsCompleted DESC, MatchesPlayed DESC) as Rank
                    FROM (
                        SELECT 
                            a.Email,
                            COALESCE(AVG(CAST(SUBSTRING(sub.Status, 1, CASE WHEN CHARINDEX('%', sub.Status) > 0 THEN CHARINDEX('%', sub.Status) - 1 ELSE 0 END) AS DECIMAL)), 0) as AvgScore,
                            COUNT(DISTINCT CASE WHEN sub.Status = 'Accepted' THEN sub.ProblemId END) as ProblemsCompleted,
                            COUNT(DISTINCT lp.LobbyId) as MatchesPlayed
                        FROM AlgorithmBattleArinaSchema.Auth a
                        LEFT JOIN AlgorithmBattleArinaSchema.LobbyParticipants lp ON a.Email = lp.ParticipantEmail
                        LEFT JOIN AlgorithmBattleArinaSchema.Submissions sub ON a.Email = sub.ParticipantEmail
                        GROUP BY a.Email
                    ) RankData
                )
                SELECT 
                    us.Email,
                    us.FullName,
                    COALESCE(r.Rank, 999999) as Rank,
                    us.MatchesPlayed,
                    CASE WHEN us.MatchesPlayed > 0 THEN CAST(us.ProblemsCompleted AS DECIMAL) / us.MatchesPlayed * 100 ELSE 0 END as WinRate,
                    us.ProblemsCompleted,
                    CAST(us.AvgScore as INT) as TotalScore,
                    us.LastActivity
                FROM UserStats us
                LEFT JOIN Rankings r ON us.Email = r.Email";

            var result = await _dapper.LoadDataSingleOrDefaultAsync<UserStatisticsDto>(sql, new { Email = userEmail });
            
            return result ?? new UserStatisticsDto 
            { 
                Email = userEmail, 
                FullName = userEmail,
                Rank = 999999,
                MatchesPlayed = 0,
                WinRate = 0,
                ProblemsCompleted = 0,
                TotalScore = 0
            };
        }

        public async Task<IEnumerable<LeaderboardEntryDto>> GetLeaderboard()
        {
            var sql = @"
                WITH StudentStats AS (
                    SELECT 
                        s.Email as ParticipantEmail,
                        COUNT(DISTINCT sub.MatchId) as MatchesPlayed,
                        COALESCE(SUM(sub.Score), 0) as TotalScore,
                        COUNT(CASE WHEN sub.Status = 'Accepted' THEN 1 END) as ProblemsCompleted,
                        COUNT(CASE WHEN sub.Status = 'Accepted' THEN 1 END) * 1.0 / NULLIF(COUNT(DISTINCT sub.MatchId), 0) as WinRate,
                        MAX(sub.SubmittedAt) as LastSubmission
                    FROM AlgorithmBattleArinaSchema.Student s
                    LEFT JOIN AlgorithmBattleArinaSchema.Submissions sub ON s.Email = sub.ParticipantEmail
                    WHERE s.Active = 1
                    GROUP BY s.Email
                ),
                RankedStats AS (
                    SELECT 
                        *,
                        ROW_NUMBER() OVER (ORDER BY TotalScore DESC, WinRate DESC, ProblemsCompleted DESC) as Rank
                    FROM StudentStats
                )
                SELECT 
                    Rank,
                    ParticipantEmail,
                    TotalScore,
                    ProblemsCompleted,
                    MatchesPlayed,
                    COALESCE(WinRate, 0) as WinRate,
                    COALESCE(LastSubmission, GETDATE()) as LastSubmission
                FROM RankedStats
                ORDER BY Rank";

            return await _dapper.LoadDataAsync<LeaderboardEntryDto>(sql);
        }
    }
}