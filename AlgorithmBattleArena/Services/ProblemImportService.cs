using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Exceptions;
using AlgorithmBattleArina.Models;
using AlgorithmBattleArina.Repositories;

namespace AlgorithmBattleArina.Services;

public class ProblemImportService
{
    private readonly IProblemRepository _problemRepository;
    private readonly ProblemImportValidator _validator;

    public ProblemImportService(IProblemRepository problemRepository, ProblemImportValidator validator)
    {
        _problemRepository = problemRepository;
        _validator = validator;
    }

    public async Task<ImportResultDto> ImportProblemsAsync(IEnumerable<ImportedProblemDto> problems, CancellationToken cancellationToken = default)
    {
        var problemList = problems.ToList();
        
        // Validate all problems first
        var validationErrors = new List<ImportErrorDto>();
        for (int i = 0; i < problemList.Count; i++)
        {
            var errors = await _validator.ValidateAsync(problemList[i], i + 1);
            validationErrors.AddRange(errors);
        }

        if (validationErrors.Any())
        {
            throw new ImportException(validationErrors);
        }

        // Convert DTOs to entities
        var problemEntities = problemList.Select(dto => new Problem
        {
            Slug = dto.Slug,
            Title = dto.Title,
            Description = dto.Description,
            DifficultyLevel = dto.Difficulty,
            IsPublic = dto.IsPublic,
            IsActive = dto.IsActive,
            Category = "Imported",
            TimeLimit = dto.TimeLimitMs > 0 ? dto.TimeLimitMs : 1000,
            MemoryLimit = dto.MemoryLimitMb > 0 ? dto.MemoryLimitMb : 128,
            CreatedBy = "System",
            Tags = dto.Tags?.Length > 0 ? System.Text.Json.JsonSerializer.Serialize(dto.Tags) : "[]",
            TestCases = dto.TestCases.Select(tc => new ProblemTestCase
            {
                InputData = tc.Input,
                ExpectedOutput = tc.ExpectedOutput,
                IsSample = tc.IsSample
            }).ToList()
        }).ToList();

        // Import using repository
        var importedCount = await _problemRepository.ImportProblemsAsync(problemEntities);
        
        return new ImportResultDto
        {
            Ok = true,
            Inserted = importedCount,
            Slugs = problemList.Select(p => p.Slug).ToArray()
        };
    }
}