namespace ProblemImporter.Models;

public class ProblemImportDto
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public int TimeLimitMs { get; set; }
    public int MemoryLimitMb { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public TestCaseDto[] TestCases { get; set; } = Array.Empty<TestCaseDto>();
}

public class TestCaseDto
{
    public string Input { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public bool IsSample { get; set; }
}

public class ValidationError
{
    public int Row { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}