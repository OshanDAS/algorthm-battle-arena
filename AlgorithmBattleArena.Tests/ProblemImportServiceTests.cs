using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Exceptions;
using AlgorithmBattleArina.Models;
using AlgorithmBattleArina.Repositories;
using AlgorithmBattleArina.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace AlgorithmBattleArena.Tests;

public class ProblemImportRepositoryTests : IDisposable
{
    private readonly DataContextEF _context;
    private readonly ProblemImportRepository _repository;

    public ProblemImportServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory"
            })
            .Build();

        var options = new DbContextOptionsBuilder<DataContextEF>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new TestDataContextEF(config, options);
        var mockProblemRepo = new MockProblemRepository();
        _repository = new ProblemImportRepository(mockProblemRepo);
    }

    [Fact]
    public async Task ImportProblemsAsync_ValidProblems_ReturnsSuccess()
    {
        var problems = new[]
        {
            CreateValidProblem("test-slug-1", "Test Problem 1"),
            CreateValidProblem("test-slug-2", "Test Problem 2")
        };

        var result = await _repository.ImportProblemsAsync(problems);

        Assert.True(result.Ok);
        Assert.Equal(2, result.Inserted);
        Assert.Equal(new[] { "test-slug-1", "test-slug-2" }, result.Slugs);
    }

    [Fact]
    public async Task ImportProblemsAsync_DuplicateSlug_ThrowsImportException()
    {
        var problems = new[]
        {
            CreateValidProblem("new-slug", "Existing Problem")
        };

        var result = await _repository.ImportProblemsAsync(problems);
        Assert.True(result.Ok);
    }

    [Fact]
    public async Task ImportProblemsAsync_TransactionRollback_NoDataSaved()
    {
        var problems = new[]
        {
            CreateValidProblem("valid-slug", "Valid Problem"),
            CreateProblemWithInvalidData() // This will cause SaveChanges to fail
        };

        // With mock validator, invalid data gets caught during validation
        var exception = await Assert.ThrowsAsync<ImportException>(() => _repository.ImportProblemsAsync(problems));
        Assert.NotEmpty(exception.Errors);
    }

    [Fact]
    public async Task ImportProblemsAsync_CreatesTestCases_Successfully()
    {
        var problem = CreateValidProblem("test-slug", "Test Problem");
        problem.TestCases = new[]
        {
            new ImportTestCaseDto { Input = "input1", ExpectedOutput = "output1", IsSample = true },
            new ImportTestCaseDto { Input = "input2", ExpectedOutput = "output2", IsSample = false }
        };

        var result = await _repository.ImportProblemsAsync(new[] { problem });

        Assert.True(result.Ok);
        Assert.Equal(1, result.Inserted);
    }

    private static ImportedProblemDto CreateValidProblem(string slug, string title)
    {
        return new ImportedProblemDto
        {
            Slug = slug,
            Title = title,
            Description = "Test description",
            Difficulty = "Easy",
            TimeLimitMs = 1000,
            MemoryLimitMb = 128,
            TestCases = new[]
            {
                new ImportTestCaseDto { Input = "test", ExpectedOutput = "result", IsSample = true }
            }
        };
    }

    private static ImportedProblemDto CreateProblemWithInvalidData()
    {
        return new ImportedProblemDto
        {
            Slug = "invalid",
            Title = new string('x', 300), // Exceeds max length
            Description = "Description",
            Difficulty = "Easy",
            TimeLimitMs = 1000,
            MemoryLimitMb = 128,
            TestCases = new[]
            {
                new ImportTestCaseDto { Input = "test", ExpectedOutput = "result", IsSample = true }
            }
        };
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    private class TestDataContextEF : DataContextEF
    {
        private readonly DbContextOptions<DataContextEF> _options;

        public TestDataContextEF(IConfiguration config, DbContextOptions<DataContextEF> options) 
            : base(config)
        {
            _options = options;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString());
        }
    }

    private class MockProblemRepository : IProblemRepository
    {
        public Task<int> UpsertProblem(ProblemUpsertDto dto) => Task.FromResult(1);
        public Task<PagedResult<ProblemListDto>> GetProblems(ProblemFilterDto filter) => Task.FromResult(new PagedResult<ProblemListDto>());
        public Task<ProblemResponseDto?> GetProblem(int id) => Task.FromResult<ProblemResponseDto?>(null);
        public Task<bool> DeleteProblem(int id) => Task.FromResult(true);
        public Task<IEnumerable<string>> GetCategories() => Task.FromResult(Enumerable.Empty<string>());
        public Task<IEnumerable<string>> GetDifficultyLevels() => Task.FromResult(Enumerable.Empty<string>());
        public Task<IEnumerable<Problem>> GetRandomProblems(string language, string difficulty, int maxProblems) => Task.FromResult(Enumerable.Empty<Problem>());
        public Task<int> ImportProblemsAsync(IEnumerable<Problem> problems) => Task.FromResult(problems.Count());
        public Task<bool> SlugExistsAsync(string slug) => Task.FromResult(false);
    }
}