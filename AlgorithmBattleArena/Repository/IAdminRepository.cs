using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Helpers;

namespace AlgorithmBattleArina.Repositories
{
    public interface IAdminRepository
    {
        Task<PagedResult<AdminUserDto>> GetUsersAsync(string? q, string? role, int page, int pageSize);
        Task<AdminUserDto?> ToggleUserActiveAsync(string id, bool deactivate);
    }
}