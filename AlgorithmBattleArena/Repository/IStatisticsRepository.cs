using AlgorithmBattleArina.Dtos;

namespace AlgorithmBattleArina.Repositories
{
    public interface IStatisticsRepository
    {
        Task<UserStatisticsDto> GetUserStatistics(string userEmail);
        Task<IEnumerable<LeaderboardEntryDto>> GetLeaderboard();
    }
}