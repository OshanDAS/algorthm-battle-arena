using System.Text.RegularExpressions;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Exceptions;
using AlgorithmBattleArina.Models;

namespace AlgorithmBattleArina.Repositories
{
    public class ProblemImportRepository : IProblemImportRepository
    {
        private readonly IProblemRepository _problemRepository;
        private static readonly Regex SlugPattern = new Regex(@"^[a-z0-9\-_.]{2,100}$", RegexOptions.Compiled);
        private static readonly HashSet<string> ValidDifficulties = new() { "Easy", "Medium", "Hard" };

        public ProblemImportRepository(IProblemRepository problemRepository)
        {
            _problemRepository = problemRepository;
        }

        public async Task<ImportResultDto> ImportProblemsAsync(IEnumerable<ImportedProblemDto> problems, CancellationToken cancellationToken = default)
        {
            var problemList = problems.ToList();
            
            // Validate all problems first
            var validationErrors = new List<ImportErrorDto>();
            for (int i = 0; i < problemList.Count; i++)
            {
                var errors = await ValidateAsync(problemList[i], i + 1);
                validationErrors.AddRange(errors);
            }

            if (validationErrors.Any())
            {
                throw new ImportException(validationErrors);
            }

            // Convert DTOs to entities
            var problemEntities = problemList.Select(dto => new Problem
            {
                Slug = dto.Slug ?? GenerateSlug(dto.Title),
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
                Slugs = problemList.Select(p => p.Slug ?? GenerateSlug(p.Title)).ToArray()
            };
        }

        public async Task<List<ImportErrorDto>> ValidateAsync(ImportedProblemDto problem, int row)
        {
            var errors = new List<ImportErrorDto>();

            if (string.IsNullOrWhiteSpace(problem.Title))
                errors.Add(new ImportErrorDto { Row = row, Field = "title", Message = "Title is required" });
            else if (problem.Title.Length > 200)
                errors.Add(new ImportErrorDto { Row = row, Field = "title", Message = "Title must be 200 characters or less" });

            if (string.IsNullOrWhiteSpace(problem.Description))
                errors.Add(new ImportErrorDto { Row = row, Field = "description", Message = "Description is required" });

            if (string.IsNullOrWhiteSpace(problem.Difficulty))
                errors.Add(new ImportErrorDto { Row = row, Field = "difficulty", Message = "Difficulty is required" });
            else if (!IsValidDifficulty(problem.Difficulty))
                errors.Add(new ImportErrorDto { Row = row, Field = "difficulty", Message = "Difficulty must be Easy, Medium, Hard, or numeric 1-5" });

            if (problem.TestCases == null || problem.TestCases.Length == 0)
                errors.Add(new ImportErrorDto { Row = row, Field = "testCases", Message = "At least one test case required" });
            else
            {
                for (int i = 0; i < problem.TestCases.Length; i++)
                {
                    var testCase = problem.TestCases[i];
                    if (string.IsNullOrWhiteSpace(testCase.Input))
                        errors.Add(new ImportErrorDto { Row = row, Field = $"testCases[{i}].input", Message = "Test case input cannot be empty" });
                    if (string.IsNullOrWhiteSpace(testCase.ExpectedOutput))
                        errors.Add(new ImportErrorDto { Row = row, Field = $"testCases[{i}].expectedOutput", Message = "Test case expected output cannot be empty" });
                }
            }

            return errors;
        }

        private static string GenerateSlug(string title)
        {
            return title.ToLower()
                .Replace(" ", "-")
                .Replace("'", "")
                .Replace("(", "")
                .Replace(")", "")
                .Replace("[", "")
                .Replace("]", "")
                .Replace("{", "")
                .Replace("}", "");
        }

        private static bool IsValidDifficulty(string difficulty)
        {
            if (ValidDifficulties.Contains(difficulty))
                return true;

            if (int.TryParse(difficulty, out int numericDifficulty))
                return numericDifficulty >= 1 && numericDifficulty <= 5;

            return false;
        }
    }
}