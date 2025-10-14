namespace AlgorithmBattleArena.Dtos;

public class ImportedProblemDto
{
    public string? Slug { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public int TimeLimitMs { get; set; }
    public int MemoryLimitMb { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public ImportTestCaseDto[] TestCases { get; set; } = Array.Empty<ImportTestCaseDto>();
}

public class ImportTestCaseDto
{
    public string Input { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public bool IsSample { get; set; }
}

public class ImportErrorDto
{
    public int Row { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class ImportResultDto
{
    public bool Ok { get; set; }
    public int Inserted { get; set; }
    public string[] Slugs { get; set; } = Array.Empty<string>();
    public ImportErrorDto[] Errors { get; set; } = Array.Empty<ImportErrorDto>();
}
