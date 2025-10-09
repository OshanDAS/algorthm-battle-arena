using AlgorithmBattleArina.Dtos;

namespace AlgorithmBattleArina.Services;

public class ProblemImportValidator
{
    public List<ImportErrorDto> ValidateProblems(List<ImportProblemDto> problems)
    {
        var errors = new List<ImportErrorDto>();
        var slugs = new HashSet<string>();

        for (int i = 0; i < problems.Count; i++)
        {
            var problem = problems[i];
            var row = i + 1;

            if (string.IsNullOrWhiteSpace(problem.Slug))
                errors.Add(new ImportErrorDto { Row = row, Field = "slug", Message = "Slug is required" });
            else if (slugs.Contains(problem.Slug))
                errors.Add(new ImportErrorDto { Row = row, Field = "slug", Message = "Duplicate slug" });
            else
                slugs.Add(problem.Slug);

            if (string.IsNullOrWhiteSpace(problem.Title))
                errors.Add(new ImportErrorDto { Row = row, Field = "title", Message = "Title is required" });

            if (string.IsNullOrWhiteSpace(problem.Description))
                errors.Add(new ImportErrorDto { Row = row, Field = "description", Message = "Description is required" });

            if (problem.TimeLimitMs <= 0)
                errors.Add(new ImportErrorDto { Row = row, Field = "timeLimitMs", Message = "Time limit must be positive" });

            if (problem.MemoryLimitMb <= 0)
                errors.Add(new ImportErrorDto { Row = row, Field = "memoryLimitMb", Message = "Memory limit must be positive" });

            if (problem.TestCases.Length == 0)
                errors.Add(new ImportErrorDto { Row = row, Field = "testCases", Message = "At least one test case required" });
        }

        return errors;
    }
}