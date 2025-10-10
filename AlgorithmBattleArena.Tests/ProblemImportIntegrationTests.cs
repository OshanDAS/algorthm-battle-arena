using System.Diagnostics;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using AlgorithmBattleArina.Controllers;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Xunit;

namespace AlgorithmBattleArena.Tests;

public class ProblemImportIntegrationTests : IDisposable
{
    private readonly DataContextEF _context;
    private readonly AdminController _controller;
    private readonly string _validTestFile;
    private readonly string _malformedTestFile;

    public ProblemImportIntegrationTests()
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
        var logger = new TestLogger<AdminController>();
        var importService = new ProblemImportService(_context);
        _controller = new AdminController(_context, logger, importService);

        // Set up admin authentication
        SetupAdminAuth();

        // Set up test file paths - resolve from project root
        var projectRoot = GetProjectRoot();
        _validTestFile = Path.Combine(projectRoot, "data", "seeds", "tests", "valid-test.json");
        _malformedTestFile = Path.Combine(projectRoot, "data", "seeds", "tests", "malformed-test.json");
    }

    [Fact]
    public async Task AdminImportEndpoint_ValidFile_InsertsProblems()
    {
        // Arrange
        var validJson = await File.ReadAllTextAsync(_validTestFile);
        var content = new StringContent(validJson, Encoding.UTF8, "application/json");
        
        // Simulate request body
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(validJson));
        _controller.ControllerContext.HttpContext.Request.Body = stream;
        _controller.ControllerContext.HttpContext.Request.ContentType = "application/json";

        // Act
        var result = await _controller.ImportProblems();

        // Assert
        var objectResult = result as ObjectResult;
        Assert.NotNull(objectResult);
        
        // Check if it's a success response (200) or error (500)
        if (objectResult.StatusCode == 500)
        {
            Assert.True(false, "Import failed with 500 error - check controller implementation");
            return;
        }
        
        Assert.Equal(200, objectResult.StatusCode);
        var importResult = Assert.IsType<ImportResultDto>(objectResult.Value);
        
        Assert.True(importResult.Ok);
        Assert.Equal(2, importResult.Inserted);
        Assert.Contains("test-problem-1", importResult.Slugs);
        Assert.Contains("test-problem-2", importResult.Slugs);

        // Verify database contains inserted problems
        var dbProblems = await _context.Problems.ToListAsync();
        Assert.Equal(2, dbProblems.Count);
        Assert.Contains(dbProblems, p => p.Title == "Test Problem 1");
        Assert.Contains(dbProblems, p => p.Title == "Test Problem 2");

        // Verify test cases were created
        var testCases = await _context.ProblemTestCases.ToListAsync();
        Assert.Equal(2, testCases.Count);
    }

    [Fact]
    public async Task AdminImportEndpoint_MalformedFile_ReturnsErrors()
    {
        // Arrange
        var malformedJson = await File.ReadAllTextAsync(_malformedTestFile);
        var stream = new MemoryStream(Encoding.UTF8.GetBytes(malformedJson));
        _controller.ControllerContext.HttpContext.Request.Body = stream;
        _controller.ControllerContext.HttpContext.Request.ContentType = "application/json";

        // Act
        var result = await _controller.ImportProblems();

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var importResult = Assert.IsType<ImportResultDto>(badRequestResult.Value);
        
        Assert.False(importResult.Ok);
        Assert.NotEmpty(importResult.Errors);

        // Verify specific validation errors
        var errors = importResult.Errors;
        Assert.Contains(errors, e => e.Row == 1 && e.Field == "slug" && e.Message == "Slug is required");
        Assert.Contains(errors, e => e.Row == 1 && e.Field == "title" && e.Message == "Title is required");
        Assert.Contains(errors, e => e.Row == 1 && e.Field == "difficulty" && e.Message.Contains("Easy, Medium, Hard"));
        Assert.Contains(errors, e => e.Row == 1 && e.Field == "timeLimitMs" && e.Message == "Time limit must be positive");
        Assert.Contains(errors, e => e.Row == 1 && e.Field == "testCases" && e.Message == "At least one test case required");

        // Verify no data was inserted due to validation failure
        var dbProblems = await _context.Problems.ToListAsync();
        Assert.Empty(dbProblems);
    }

    [Fact]
    public void CLI_DryRun_MalformedFile_ReturnsNonZeroExit()
    {
        // Arrange
        var cliPath = Path.Combine("tools", "ProblemImporter", "bin", "Debug", "net8.0", "ProblemImporter.exe");
        var absoluteMalformedPath = Path.GetFullPath(_malformedTestFile);

        // Skip test if CLI executable doesn't exist
        if (!File.Exists(cliPath))
        {
            Assert.True(true, "CLI executable not found, skipping test");
            return;
        }

        // Act
        var processInfo = new ProcessStartInfo
        {
            FileName = cliPath,
            Arguments = $"--file \"{absoluteMalformedPath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(processInfo);
        process?.WaitForExit();
        var output = process?.StandardOutput.ReadToEnd() ?? "";
        var error = process?.StandardError.ReadToEnd() ?? "";
        var exitCode = process?.ExitCode ?? 0;

        // Assert
        Assert.NotEqual(0, exitCode); // Non-zero exit code indicates validation failure
        Assert.Contains("Validation failed", output + error);
        Assert.Contains("Row 1", output + error); // Should show row-level errors
    }

    [Fact]
    public void CLI_DryRun_ValidFile_ReturnsZeroExit()
    {
        // Arrange
        var cliPath = Path.Combine("tools", "ProblemImporter", "bin", "Debug", "net8.0", "ProblemImporter.exe");
        var absoluteValidPath = Path.GetFullPath(_validTestFile);

        // Skip test if CLI executable doesn't exist
        if (!File.Exists(cliPath))
        {
            Assert.True(true, "CLI executable not found, skipping test");
            return;
        }

        // Act
        var processInfo = new ProcessStartInfo
        {
            FileName = cliPath,
            Arguments = $"--file \"{absoluteValidPath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(processInfo);
        process?.WaitForExit();
        var output = process?.StandardOutput.ReadToEnd() ?? "";
        var exitCode = process?.ExitCode ?? 0;

        // Assert
        Assert.Equal(0, exitCode); // Zero exit code indicates success
        Assert.Contains("Validation passed", output);
        Assert.Contains("Dry-run complete", output);
    }

    private void SetupAdminAuth()
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Email, "admin@test.com"),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(ClaimTypes.NameIdentifier, "1")
        }, "TestAuth");

        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(identity)
        };
        httpContext.Items["CorrelationId"] = "test-correlation-id";

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
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

    private static string GetProjectRoot()
    {
        var currentDir = Directory.GetCurrentDirectory();
        while (currentDir != null && !File.Exists(Path.Combine(currentDir, "algorithm-battle-arena.sln")))
        {
            currentDir = Directory.GetParent(currentDir)?.FullName;
        }
        return currentDir ?? Directory.GetCurrentDirectory();
    }

    private class TestLogger<T> : ILogger<T>
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => false;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
    }
}