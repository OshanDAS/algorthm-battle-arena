using AlgorithmBattleArina.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AlgorithmBattleArina.Repositories
{
    public interface IMatchRepository
    {
        Task<Match> CreateMatch(int lobbyId, IEnumerable<int> problemIds);
    }
}
