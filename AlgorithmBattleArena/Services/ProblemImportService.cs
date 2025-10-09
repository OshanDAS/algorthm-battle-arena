using System.Text.Json;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Exceptions;
using AlgorithmBattleArina.Models;
using Microsoft.EntityFrameworkCore;

namespace AlgorithmBattleArina.Services;

public class ProblemImportService
{
    private readonly DataContextEF _context;

    public ProblemImportService(DataContextEF context)
    {
        _context = context;
    }

    public async Task<ImportResultDto> ImportProblemsAsync(IEnumerable<ImportedProblemDto> problems, CancellationToken cancellationToken = default)
    {
        var problemList = problems.ToList();
        
        // Check for existing slugs in database
        var slugs = problemList.Select(p => p.Title).ToList(); // Using Title as slug equivalent
        var existingSlugs = await _context.Problems
            .Where(p => slugs.Contains(p.Title))
            .Select(p => p.Title)
            .ToListAsync(cancellationToken);

        if (existingSlugs.Any())
        {
            var errors = new List<ImportErrorDto>();
            for (int i = 0; i < problemList.Count; i++)
            {
                if (existingSlugs.Contains(problemList[i].Title))
                {
                    errors.Add(new ImportErrorDto 
                    { 
                        Row = i + 1, 
                        Field = "slug", 
                        Message = "Slug already exists in database" 
                    });
                }
            }
            throw new ImportException(errors);
        }

        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var insertedSlugs = new List<string>();

            foreach (var dto in problemList)
            {
                var problem = new Problem
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    DifficultyLevel = dto.Difficulty,
                    Category = "Imported",
                    IsPublic = dto.IsPublic,
                    IsActive = dto.IsActive,
                    TimeLimit = dto.TimeLimitMs,
                    MemoryLimit = dto.MemoryLimitMb,
                    Tags = JsonSerializer.Serialize(dto.Tags),
                    CreatedBy = "System",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Problems.Add(problem);
                await _context.SaveChangesAsync(cancellationToken);

                foreach (var testCase in dto.TestCases)
                {
                    var tc = new ProblemTestCase
                    {
                        ProblemId = problem.ProblemId,
                        InputData = testCase.Input,
                        ExpectedOutput = testCase.ExpectedOutput,
                        IsSample = testCase.IsSample
                    };
                    _context.ProblemTestCases.Add(tc);
                }

                insertedSlugs.Add(dto.Slug);
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new ImportResultDto
            {
                Ok = true,
                Inserted = problemList.Count,
                Slugs = insertedSlugs.ToArray()
            };
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}