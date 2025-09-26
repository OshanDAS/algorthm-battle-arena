using Xunit;
using Moq;
using AlgorithmBattleArina.Repositories;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Models;
using AlgorithmBattleArina.Helpers;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace AlgorithmBattleArena.Tests;

public class ProblemRepositoryTests
{
    private readonly Mock<IDataContextDapper> _mockDapper;
    private readonly ProblemRepository _repository;

    public ProblemRepositoryTests()
    {
        _mockDapper = new Mock<IDataContextDapper>();
        _repository = new ProblemRepository(_mockDapper.Object);
    }

    [Fact]
    public async Task UpsertProblem_ValidDto_ReturnsId()
    {
        var dto = new ProblemUpsertDto
        {
            Title = "Test Problem",
            Description = "Test Description",
            DifficultyLevel = "Easy",
            Category = "Array",
            TimeLimit = 1000,
            MemoryLimit = 256,
            CreatedBy = "test@test.com",
            Tags = "array,sorting",
            TestCases = "test cases",
            Solutions = "solutions"
        };
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(1);

        var result = await _repository.UpsertProblem(dto);

        Assert.Equal(1, result);
        _mockDapper.Verify(d => d.LoadDataSingleAsync<int>(
            It.Is<string>(s => s.Contains("spUpsertProblem")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task GetProblems_NoFilters_ReturnsPagedResult()
    {
        var filter = new ProblemFilterDto { Page = 1, PageSize = 10 };
        var problems = new List<ProblemListDto>
        {
            new ProblemListDto { ProblemId = 1, Title = "Problem 1", DifficultyLevel = "Easy", Category = "Array", CreatedBy = "test@test.com", CreatedAt = DateTime.Now }
        };
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(1);
        _mockDapper.Setup(d => d.LoadDataAsync<ProblemListDto>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(problems);

        var result = await _repository.GetProblems(filter);

        Assert.Equal(1, result.Total);
        Assert.Single(result.Items);
        Assert.Equal("Problem 1", result.Items.First().Title);
    }

    [Fact]
    public async Task GetProblems_WithCategoryFilter_AppliesFilter()
    {
        var filter = new ProblemFilterDto { Category = "Array", Page = 1, PageSize = 10 };
        var problems = new List<ProblemListDto>();
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(0);
        _mockDapper.Setup(d => d.LoadDataAsync<ProblemListDto>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(problems);

        var result = await _repository.GetProblems(filter);

        _mockDapper.Verify(d => d.LoadDataSingleAsync<int>(
            It.Is<string>(s => s.Contains("WHERE") && s.Contains("Category = @Category")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task GetProblems_WithDifficultyFilter_AppliesFilter()
    {
        var filter = new ProblemFilterDto { DifficultyLevel = "Hard", Page = 1, PageSize = 10 };
        var problems = new List<ProblemListDto>();
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(0);
        _mockDapper.Setup(d => d.LoadDataAsync<ProblemListDto>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(problems);

        var result = await _repository.GetProblems(filter);

        _mockDapper.Verify(d => d.LoadDataSingleAsync<int>(
            It.Is<string>(s => s.Contains("WHERE") && s.Contains("DifficultyLevel = @DifficultyLevel")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task GetProblems_WithSearchTerm_AppliesFilter()
    {
        var filter = new ProblemFilterDto { SearchTerm = "test", Page = 1, PageSize = 10 };
        var problems = new List<ProblemListDto>();
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(0);
        _mockDapper.Setup(d => d.LoadDataAsync<ProblemListDto>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(problems);

        var result = await _repository.GetProblems(filter);

        _mockDapper.Verify(d => d.LoadDataSingleAsync<int>(
            It.Is<string>(s => s.Contains("WHERE") && s.Contains("Title LIKE @SearchTerm OR Description LIKE @SearchTerm")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task GetProblems_WithAllFilters_AppliesAllFilters()
    {
        var filter = new ProblemFilterDto 
        { 
            Category = "Array", 
            DifficultyLevel = "Medium", 
            SearchTerm = "sort", 
            Page = 2, 
            PageSize = 5 
        };
        var problems = new List<ProblemListDto>();
        _mockDapper.Setup(d => d.LoadDataSingleAsync<int>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(0);
        _mockDapper.Setup(d => d.LoadDataAsync<ProblemListDto>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(problems);

        var result = await _repository.GetProblems(filter);

        _mockDapper.Verify(d => d.LoadDataAsync<ProblemListDto>(
            It.Is<string>(s => s.Contains("OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task GetProblem_ExistingId_ReturnsCompleteDto()
    {
        var problem = new Problem
        {
            ProblemId = 1,
            Title = "Test Problem",
            Description = "Description",
            DifficultyLevel = "Easy",
            Category = "Array",
            TimeLimit = 1000,
            MemoryLimit = 256,
            CreatedBy = "test@test.com",
            Tags = "array",
            CreatedAt = DateTime.Now
        };
        var testCases = new List<ProblemTestCase>
        {
            new ProblemTestCase { TestCaseId = 1, ProblemId = 1, InputData = "input", ExpectedOutput = "output", IsSample = true }
        };
        var solutions = new List<ProblemSolution>
        {
            new ProblemSolution { SolutionId = 1, ProblemId = 1, Language = "C#", SolutionText = "solution", CreatedAt = DateTime.Now }
        };

        _mockDapper.Setup(d => d.LoadDataSingleOrDefaultAsync<Problem>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(problem);
        _mockDapper.Setup(d => d.LoadDataAsync<ProblemTestCase>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(testCases);
        _mockDapper.Setup(d => d.LoadDataAsync<ProblemSolution>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(solutions);

        var result = await _repository.GetProblem(1);

        Assert.NotNull(result);
        Assert.Equal(1, result!.ProblemId);
        Assert.Equal("Test Problem", result.Title);
        Assert.Single(result.TestCases);
        Assert.Single(result.Solutions);
    }

    [Fact]
    public async Task GetProblem_NonExistentId_ReturnsNull()
    {
        _mockDapper.Setup(d => d.LoadDataSingleOrDefaultAsync<Problem>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync((Problem?)null);

        var result = await _repository.GetProblem(999);

        Assert.Null(result);
        _mockDapper.Verify(d => d.LoadDataAsync<ProblemTestCase>(It.IsAny<string>(), It.IsAny<object>()), Times.Never);
        _mockDapper.Verify(d => d.LoadDataAsync<ProblemSolution>(It.IsAny<string>(), It.IsAny<object>()), Times.Never);
    }

    [Fact]
    public async Task DeleteProblem_ValidId_ReturnsTrue()
    {
        _mockDapper.Setup(d => d.ExecuteSqlAsync(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(true);

        var result = await _repository.DeleteProblem(1);

        Assert.True(result);
        _mockDapper.Verify(d => d.ExecuteSqlAsync(
            It.Is<string>(s => s.Contains("DELETE FROM AlgorithmBattleArinaSchema.ProblemSolutions") &&
                              s.Contains("DELETE FROM AlgorithmBattleArinaSchema.ProblemTestCases") &&
                              s.Contains("DELETE FROM AlgorithmBattleArinaSchema.Problems")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task DeleteProblem_InvalidId_ReturnsFalse()
    {
        _mockDapper.Setup(d => d.ExecuteSqlAsync(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(false);

        var result = await _repository.DeleteProblem(999);

        Assert.False(result);
    }

    [Fact]
    public async Task GetCategories_ReturnsDistinctCategories()
    {
        var categories = new List<string> { "Array", "String", "Dynamic Programming" };
        _mockDapper.Setup(d => d.LoadDataAsync<string>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(categories);

        var result = await _repository.GetCategories();

        Assert.Equal(3, result.Count());
        Assert.Contains("Array", result);
        Assert.Contains("String", result);
        Assert.Contains("Dynamic Programming", result);
        _mockDapper.Verify(d => d.LoadDataAsync<string>(
            It.Is<string>(s => s.Contains("DISTINCT Category") && s.Contains("ORDER BY Category")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task GetDifficultyLevels_ReturnsDistinctLevels()
    {
        var levels = new List<string> { "Easy", "Medium", "Hard" };
        _mockDapper.Setup(d => d.LoadDataAsync<string>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(levels);

        var result = await _repository.GetDifficultyLevels();

        Assert.Equal(3, result.Count());
        Assert.Contains("Easy", result);
        Assert.Contains("Medium", result);
        Assert.Contains("Hard", result);
        _mockDapper.Verify(d => d.LoadDataAsync<string>(
            It.Is<string>(s => s.Contains("DISTINCT DifficultyLevel") && s.Contains("ORDER BY DifficultyLevel")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task GetRandomProblems_WithSpecificDifficulty_AppliesDifficultyFilter()
    {
        var problems = new List<Problem>
        {
            new Problem { ProblemId = 1, Title = "Problem 1", DifficultyLevel = "Easy", Category = "Array", CreatedBy = "test", Tags = "test", TimeLimit = 1000, MemoryLimit = 256 }
        };
        _mockDapper.Setup(d => d.LoadDataAsync<Problem>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(problems);

        var result = await _repository.GetRandomProblems("C#", "Easy", 5);

        Assert.Single(result);
        _mockDapper.Verify(d => d.LoadDataAsync<Problem>(
            It.Is<string>(s => s.Contains("WHERE s.Language = @Language") && 
                              s.Contains("AND p.DifficultyLevel = @Difficulty") &&
                              s.Contains("ORDER BY NEWID()")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task GetRandomProblems_WithMixedDifficulty_DoesNotApplyDifficultyFilter()
    {
        var problems = new List<Problem>
        {
            new Problem { ProblemId = 1, Title = "Problem 1", DifficultyLevel = "Easy", Category = "Array", CreatedBy = "test", Tags = "test", TimeLimit = 1000, MemoryLimit = 256 },
            new Problem { ProblemId = 2, Title = "Problem 2", DifficultyLevel = "Hard", Category = "String", CreatedBy = "test", Tags = "test", TimeLimit = 2000, MemoryLimit = 512 }
        };
        _mockDapper.Setup(d => d.LoadDataAsync<Problem>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(problems);

        var result = await _repository.GetRandomProblems("Python", "Mixed", 10);

        Assert.Equal(2, result.Count());
        _mockDapper.Verify(d => d.LoadDataAsync<Problem>(
            It.Is<string>(s => s.Contains("WHERE s.Language = @Language") && 
                              !s.Contains("AND p.DifficultyLevel = @Difficulty") &&
                              s.Contains("ORDER BY NEWID()")),
            It.IsAny<object>()), Times.Once);
    }

    [Fact]
    public async Task GetRandomProblems_EmptyResult_ReturnsEmptyCollection()
    {
        var problems = new List<Problem>();
        _mockDapper.Setup(d => d.LoadDataAsync<Problem>(It.IsAny<string>(), It.IsAny<object>())).ReturnsAsync(problems);

        var result = await _repository.GetRandomProblems("Java", "Medium", 3);

        Assert.Empty(result);
    }
}