using AlgorithmBattleArina.Models;
using AlgorithmBattleArina.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AlgorithmBattleArina.Repositories
{
    public interface IMatchRepository
    {
        Task<Match> CreateMatch(int lobbyId, IEnumerable<int> problemIds);
        Task<IEnumerable<LeaderboardEntryDto>> GetMatchLeaderboard(int matchId);
        Task<IEnumerable<LeaderboardEntryDto>> GetGlobalLeaderboard();
    }
}
