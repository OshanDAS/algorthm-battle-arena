using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Exceptions;
using AlgorithmBattleArina.Models;
using AlgorithmBattleArina.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace AlgorithmBattleArena.Tests;

public class ProblemImportServiceTests : IDisposable
{
    private readonly DataContextEF _context;
    private readonly ProblemImportService _service;

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
        _service = new ProblemImportService(_context);
    }

    [Fact]
    public async Task ImportProblemsAsync_ValidProblems_ReturnsSuccess()
    {
        var problems = new[]
        {
            CreateValidProblem("test-slug-1", "Test Problem 1"),
            CreateValidProblem("test-slug-2", "Test Problem 2")
        };

        var result = await _service.ImportProblemsAsync(problems);

        Assert.True(result.Ok);
        Assert.Equal(2, result.Inserted);
        Assert.Equal(new[] { "test-slug-1", "test-slug-2" }, result.Slugs);

        var dbProblems = await _context.Problems.ToListAsync();
        Assert.Equal(2, dbProblems.Count);
        Assert.Contains(dbProblems, p => p.Title == "Test Problem 1");
        Assert.Contains(dbProblems, p => p.Title == "Test Problem 2");
    }

    [Fact]
    public async Task ImportProblemsAsync_DuplicateSlug_ThrowsImportException()
    {
        // Insert existing problem
        var existingProblem = new Problem
        {
            Title = "Existing Problem",
            Description = "Description",
            DifficultyLevel = "Easy",
            Category = "Test",
            TimeLimit = 1000,
            MemoryLimit = 128,
            Tags = "[]",
            CreatedBy = "Test",
            CreatedAt = DateTime.UtcNow
        };
        _context.Problems.Add(existingProblem);
        await _context.SaveChangesAsync();

        var problems = new[]
        {
            CreateValidProblem("new-slug", "Existing Problem") // Same title as existing
        };

        var exception = await Assert.ThrowsAsync<ImportException>(() => _service.ImportProblemsAsync(problems));
        Assert.Single(exception.Errors);
        Assert.Equal("slug", exception.Errors[0].Field);
        Assert.Contains("already exists", exception.Errors[0].Message);
    }

    [Fact]
    public async Task ImportProblemsAsync_TransactionRollback_NoDataSaved()
    {
        var problems = new[]
        {
            CreateValidProblem("valid-slug", "Valid Problem"),
            CreateProblemWithInvalidData() // This will cause SaveChanges to fail
        };

        await Assert.ThrowsAsync<DbUpdateException>(() => _service.ImportProblemsAsync(problems));

        var dbProblems = await _context.Problems.ToListAsync();
        Assert.Empty(dbProblems); // No problems should be saved due to rollback
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

        var result = await _service.ImportProblemsAsync(new[] { problem });

        Assert.True(result.Ok);
        var testCases = await _context.ProblemTestCases.ToListAsync();
        Assert.Equal(2, testCases.Count);
        Assert.Contains(testCases, tc => tc.InputData == "input1" && tc.IsSample);
        Assert.Contains(testCases, tc => tc.InputData == "input2" && !tc.IsSample);
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
}