using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Services;
using Xunit;

namespace AlgorithmBattleArena.Tests;

public class ProblemImportValidatorTests
{
    private readonly ProblemImportValidator _validator = new();

    [Fact]
    public void ValidateProblem_ValidProblem_ReturnsTrue()
    {
        var problem = new ImportedProblemDto
        {
            Slug = "valid-slug",
            Title = "Valid Title",
            Description = "Valid description",
            Difficulty = "Easy",
            TimeLimitMs = 1000,
            MemoryLimitMb = 128,
            TestCases = new[]
            {
                new ImportTestCaseDto { Input = "input", ExpectedOutput = "output", IsSample = true }
            }
        };

        var (isValid, errors) = _validator.ValidateProblem(problem);

        Assert.True(isValid);
        Assert.Empty(errors);
    }

    [Theory]
    [InlineData("")]
    [InlineData("INVALID-SLUG")]
    [InlineData("invalid slug")]
    [InlineData("invalid@slug")]
    [InlineData("a")]
    public void ValidateProblem_InvalidSlug_ReturnsError(string slug)
    {
        var problem = CreateValidProblem();
        problem.Slug = slug;

        var (isValid, errors) = _validator.ValidateProblem(problem);

        Assert.False(isValid);
        if (string.IsNullOrEmpty(slug))
            Assert.Contains(errors, e => e.Field == "slug" && e.Message == "Slug is required");
        else
            Assert.Contains(errors, e => e.Field == "slug" && e.Message.Contains("pattern"));
    }

    [Fact]
    public void ValidateProblem_MissingTitle_ReturnsError()
    {
        var problem = CreateValidProblem();
        problem.Title = "";

        var (isValid, errors) = _validator.ValidateProblem(problem);

        Assert.False(isValid);
        Assert.Contains(errors, e => e.Field == "title" && e.Message == "Title is required");
    }

    [Fact]
    public void ValidateProblem_TitleTooLong_ReturnsError()
    {
        var problem = CreateValidProblem();
        problem.Title = new string('a', 201);

        var (isValid, errors) = _validator.ValidateProblem(problem);

        Assert.False(isValid);
        Assert.Contains(errors, e => e.Field == "title" && e.Message.Contains("200 characters"));
    }

    [Fact]
    public void ValidateProblem_MissingDescription_ReturnsError()
    {
        var problem = CreateValidProblem();
        problem.Description = "";

        var (isValid, errors) = _validator.ValidateProblem(problem);

        Assert.False(isValid);
        Assert.Contains(errors, e => e.Field == "description" && e.Message == "Description is required");
    }

    [Theory]
    [InlineData("")]
    [InlineData("Invalid")]
    [InlineData("0")]
    [InlineData("6")]
    public void ValidateProblem_InvalidDifficulty_ReturnsError(string difficulty)
    {
        var problem = CreateValidProblem();
        problem.Difficulty = difficulty;

        var (isValid, errors) = _validator.ValidateProblem(problem);

        Assert.False(isValid);
        if (string.IsNullOrEmpty(difficulty))
            Assert.Contains(errors, e => e.Field == "difficulty" && e.Message == "Difficulty is required");
        else
            Assert.Contains(errors, e => e.Field == "difficulty" && e.Message.Contains("Easy, Medium, Hard"));
    }

    [Theory]
    [InlineData("Easy")]
    [InlineData("Medium")]
    [InlineData("Hard")]
    [InlineData("1")]
    [InlineData("3")]
    [InlineData("5")]
    public void ValidateProblem_ValidDifficulty_Passes(string difficulty)
    {
        var problem = CreateValidProblem();
        problem.Difficulty = difficulty;

        var (isValid, _) = _validator.ValidateProblem(problem);

        Assert.True(isValid);
    }

    [Fact]
    public void ValidateProblem_NoTestCases_ReturnsError()
    {
        var problem = CreateValidProblem();
        problem.TestCases = Array.Empty<ImportTestCaseDto>();

        var (isValid, errors) = _validator.ValidateProblem(problem);

        Assert.False(isValid);
        Assert.Contains(errors, e => e.Field == "testCases" && e.Message == "At least one test case required");
    }

    [Fact]
    public void ValidateProblem_EmptyTestCaseInput_ReturnsError()
    {
        var problem = CreateValidProblem();
        problem.TestCases[0].Input = "";

        var (isValid, errors) = _validator.ValidateProblem(problem);

        Assert.False(isValid);
        Assert.Contains(errors, e => e.Field == "testCases[0].input" && e.Message.Contains("cannot be empty"));
    }

    [Fact]
    public void ValidateProblem_EmptyTestCaseOutput_ReturnsError()
    {
        var problem = CreateValidProblem();
        problem.TestCases[0].ExpectedOutput = "";

        var (isValid, errors) = _validator.ValidateProblem(problem);

        Assert.False(isValid);
        Assert.Contains(errors, e => e.Field == "testCases[0].expectedOutput" && e.Message.Contains("cannot be empty"));
    }

    [Fact]
    public void ValidateBatch_DuplicateSlugs_ReturnsError()
    {
        var problems = new[]
        {
            CreateValidProblem(),
            CreateValidProblem()
        };

        var errors = _validator.ValidateBatch(problems);

        Assert.Contains(errors, e => e.Row == 2 && e.Field == "slug" && e.Message == "Duplicate slug within batch");
    }

    [Fact]
    public void ValidateBatch_SetsRowNumbers_Correctly()
    {
        var problems = new[]
        {
            CreateValidProblem(),
            new ImportedProblemDto { Slug = "invalid", Title = "", Description = "desc", Difficulty = "Easy" }
        };

        var errors = _validator.ValidateBatch(problems);

        Assert.Contains(errors, e => e.Row == 2 && e.Field == "title");
    }

    private static ImportedProblemDto CreateValidProblem()
    {
        return new ImportedProblemDto
        {
            Slug = "valid-slug",
            Title = "Valid Title",
            Description = "Valid description",
            Difficulty = "Easy",
            TimeLimitMs = 1000,
            MemoryLimitMb = 128,
            TestCases = new[]
            {
                new ImportTestCaseDto { Input = "input", ExpectedOutput = "output", IsSample = true }
            }
        };
    }
}