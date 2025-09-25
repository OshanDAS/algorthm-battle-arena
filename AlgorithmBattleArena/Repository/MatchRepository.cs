using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Models;
using Dapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AlgorithmBattleArina.Repositories
{
    public class MatchRepository : IMatchRepository
    {
        private readonly IDataContextDapper _dapper;

        public MatchRepository(IDataContextDapper dapper)
        {
            _dapper = dapper;
        }

        public async Task<Match> CreateMatch(int lobbyId, IEnumerable<int> problemIds)
        {
            var matchSql = @"INSERT INTO AlgorithmBattleArinaSchema.Matches (LobbyId) VALUES (@LobbyId);
                           SELECT CAST(SCOPE_IDENTITY() as int)";
            var matchId = await _dapper.LoadDataSingleAsync<int>(matchSql, new { LobbyId = lobbyId });

            if (problemIds.Any())
            {
                var matchProblemsSql = "INSERT INTO AlgorithmBattleArinaSchema.MatchProblems (MatchId, ProblemId) VALUES (@MatchId, @ProblemId)";
                foreach (var problemId in problemIds)
                {
                    await _dapper.ExecuteSqlAsync(matchProblemsSql, new { MatchId = matchId, ProblemId = problemId });
                }
            }

            return new Match { MatchId = matchId, LobbyId = lobbyId, StartedAt = System.DateTime.UtcNow };
        }
    }
}
