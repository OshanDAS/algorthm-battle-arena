using System.Text.RegularExpressions;
using AlgorithmBattleArina.Dtos;

namespace AlgorithmBattleArina.Services;

public class ProblemImportValidator
{
    private static readonly Regex SlugPattern = new Regex(@"^[a-z0-9\-_.]{2,100}$", RegexOptions.Compiled);
    private static readonly HashSet<string> ValidDifficulties = new() { "Easy", "Medium", "Hard" };

    public (bool isValid, List<ImportErrorDto> errors) ValidateProblem(ImportedProblemDto problem)
    {
        var errors = new List<ImportErrorDto>();

        if (string.IsNullOrWhiteSpace(problem.Slug))
            errors.Add(new ImportErrorDto { Row = 0, Field = "slug", Message = "Slug is required" });
        else if (!SlugPattern.IsMatch(problem.Slug))
            errors.Add(new ImportErrorDto { Row = 0, Field = "slug", Message = "Slug must match pattern ^[a-z0-9\\-_.]{2,100}$" });

        if (string.IsNullOrWhiteSpace(problem.Title))
            errors.Add(new ImportErrorDto { Row = 0, Field = "title", Message = "Title is required" });
        else if (problem.Title.Length > 200)
            errors.Add(new ImportErrorDto { Row = 0, Field = "title", Message = "Title must be 200 characters or less" });

        if (string.IsNullOrWhiteSpace(problem.Description))
            errors.Add(new ImportErrorDto { Row = 0, Field = "description", Message = "Description is required" });

        if (string.IsNullOrWhiteSpace(problem.Difficulty))
            errors.Add(new ImportErrorDto { Row = 0, Field = "difficulty", Message = "Difficulty is required" });
        else if (!IsValidDifficulty(problem.Difficulty))
            errors.Add(new ImportErrorDto { Row = 0, Field = "difficulty", Message = "Difficulty must be Easy, Medium, Hard, or numeric 1-5" });

        if (problem.TimeLimitMs <= 0)
            errors.Add(new ImportErrorDto { Row = 0, Field = "timeLimitMs", Message = "Time limit must be positive" });

        if (problem.MemoryLimitMb <= 0)
            errors.Add(new ImportErrorDto { Row = 0, Field = "memoryLimitMb", Message = "Memory limit must be positive" });

        if (problem.TestCases == null || problem.TestCases.Length == 0)
            errors.Add(new ImportErrorDto { Row = 0, Field = "testCases", Message = "At least one test case required" });
        else
        {
            for (int i = 0; i < problem.TestCases.Length; i++)
            {
                var testCase = problem.TestCases[i];
                if (string.IsNullOrWhiteSpace(testCase.Input))
                    errors.Add(new ImportErrorDto { Row = 0, Field = $"testCases[{i}].input", Message = "Test case input cannot be empty" });
                if (string.IsNullOrWhiteSpace(testCase.ExpectedOutput))
                    errors.Add(new ImportErrorDto { Row = 0, Field = $"testCases[{i}].expectedOutput", Message = "Test case expected output cannot be empty" });
            }
        }

        return (errors.Count == 0, errors);
    }

    public List<ImportErrorDto> ValidateBatch(IEnumerable<ImportedProblemDto> problems)
    {
        var allErrors = new List<ImportErrorDto>();
        var slugs = new HashSet<string>();
        var problemList = problems.ToList();

        for (int i = 0; i < problemList.Count; i++)
        {
            var problem = problemList[i];
            var row = i + 1;

            var (_, errors) = ValidateProblem(problem);
            foreach (var error in errors)
            {
                error.Row = row;
                allErrors.Add(error);
            }

            // Check for duplicate slugs within batch
            if (!string.IsNullOrWhiteSpace(problem.Slug))
            {
                if (slugs.Contains(problem.Slug))
                    allErrors.Add(new ImportErrorDto { Row = row, Field = "slug", Message = "Duplicate slug within batch" });
                else
                    slugs.Add(problem.Slug);
            }
        }

        return allErrors;
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