using System.Text.RegularExpressions;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Repositories;

namespace AlgorithmBattleArina.Services;

public class ProblemImportValidator
{
    private readonly IProblemRepository _problemRepository;
    private static readonly Regex SlugPattern = new Regex(@"^[a-z0-9\-_.]{2,100}$", RegexOptions.Compiled);
    private static readonly HashSet<string> ValidDifficulties = new() { "Easy", "Medium", "Hard" };

    public ProblemImportValidator(IProblemRepository problemRepository)
    {
        _problemRepository = problemRepository;
    }

    public async Task<List<ImportErrorDto>> ValidateAsync(ImportedProblemDto problem, int row)
    {
        var errors = new List<ImportErrorDto>();

        // Skip slug validation - auto-generated from title

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



    private static bool IsValidDifficulty(string difficulty)
    {
        if (ValidDifficulties.Contains(difficulty))
            return true;

        if (int.TryParse(difficulty, out int numericDifficulty))
            return numericDifficulty >= 1 && numericDifficulty <= 5;

        return false;
    }
}