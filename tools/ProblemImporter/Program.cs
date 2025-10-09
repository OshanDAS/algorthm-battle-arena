using System.CommandLine;
using System.Text.Json;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ProblemImporter.Models;
using ProblemImporter.Services;

var fileOption = new Option<string>("--file", "Path to the input file") { IsRequired = true };
var formatOption = new Option<string?>("--format", "File format (json|csv, auto-detect if omitted)");
var confirmOption = new Option<bool>("--confirm", "Execute import (default: dry-run)");
var maxRowsOption = new Option<int>("--max-rows", () => 1000, "Maximum rows to process");
var connectionStringOption = new Option<string?>("--connection-string", "Override connection string");

var rootCommand = new RootCommand("Problem Importer CLI")
{
    fileOption, formatOption, confirmOption, maxRowsOption, connectionStringOption
};

rootCommand.SetHandler(async (file, format, confirm, maxRows, connectionString) =>
{
    try
    {
        Console.WriteLine($"Processing file: {file}");
        Console.WriteLine($"Mode: {(confirm ? "CONFIRM" : "DRY-RUN")}");
        Console.WriteLine($"Max rows: {maxRows}");
        Console.WriteLine();

        var parser = new FileParser();
        var problems = parser.ParseFile(file, format);

        if (problems.Count > maxRows)
        {
            Console.WriteLine($"Warning: File contains {problems.Count} rows, limiting to {maxRows}");
            problems = problems.Take(maxRows).ToList();
        }

        var validator = new ProblemValidator();
        var errors = validator.ValidateProblems(problems);

        if (errors.Any())
        {
            Console.WriteLine($"Validation failed with {errors.Count} errors:");
            foreach (var error in errors)
            {
                Console.WriteLine($"  Row {error.Row}, Field '{error.Field}': {error.Message}");
            }
            Environment.Exit(1);
        }

        Console.WriteLine($"Validation passed for {problems.Count} problems");

        if (!confirm)
        {
            Console.WriteLine("Dry-run complete. Use --confirm to execute import.");
            return;
        }

        await ImportProblems(problems, connectionString);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
        Environment.Exit(1);
    }
}, fileOption, formatOption, confirmOption, maxRowsOption, connectionStringOption);

return await rootCommand.InvokeAsync(args);

static async Task ImportProblems(List<ProblemImportDto> problems, string? connectionString)
{
    var config = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = connectionString ?? "Server=localhost;Database=AlgorithmBattleArina;Trusted_Connection=true;TrustServerCertificate=true;"
        })
        .Build();

    using var context = new DataContextEF(config);
    using var transaction = await context.Database.BeginTransactionAsync();

    try
    {
        int inserted = 0, failed = 0, skipped = 0;

        foreach (var dto in problems)
        {
            try
            {
                var existing = await context.Problems.FirstOrDefaultAsync(p => p.Title == dto.Title);
                if (existing != null)
                {
                    skipped++;
                    continue;
                }

                var problem = new Problem
                {
                    Title = dto.Title,
                    Description = dto.Description,
                    DifficultyLevel = dto.Difficulty,
                    Category = "General",
                    IsPublic = dto.IsPublic,
                    IsActive = dto.IsActive,
                    TimeLimit = dto.TimeLimitMs,
                    MemoryLimit = dto.MemoryLimitMb,
                    Tags = JsonSerializer.Serialize(dto.Tags),
                    CreatedBy = "System",
                    CreatedAt = DateTime.UtcNow
                };

                context.Problems.Add(problem);
                await context.SaveChangesAsync();

                foreach (var testCase in dto.TestCases)
                {
                    var tc = new ProblemTestCase
                    {
                        ProblemId = problem.ProblemId,
                        InputData = testCase.Input,
                        ExpectedOutput = testCase.ExpectedOutput,
                        IsSample = testCase.IsSample
                    };
                    context.ProblemTestCases.Add(tc);
                }

                await context.SaveChangesAsync();
                inserted++;
                Console.WriteLine($"Imported: {dto.Title}");
            }
            catch (Exception ex)
            {
                failed++;
                Console.WriteLine($"Failed to import {dto.Title}: {ex.Message}");
            }
        }

        await transaction.CommitAsync();
        Console.WriteLine();
        Console.WriteLine($"Import complete: {inserted} inserted, {skipped} skipped, {failed} failed");
    }
    catch (Exception ex)
    {
        await transaction.RollbackAsync();
        Console.WriteLine($"Transaction rolled back due to error: {ex.Message}");
        throw;
    }
}
