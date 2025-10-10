using AlgorithmBattleArina.Dtos;

namespace AlgorithmBattleArina.Repositories
{
    public interface IProblemImportRepository
    {
        Task<ImportResultDto> ImportProblemsAsync(IEnumerable<ImportedProblemDto> problems, CancellationToken cancellationToken = default);
        Task<List<ImportErrorDto>> ValidateAsync(ImportedProblemDto problem, int row);
    }
}