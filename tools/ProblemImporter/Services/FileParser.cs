using System.Globalization;
using System.Text.Json;
using CsvHelper;
using ProblemImporter.Models;

namespace ProblemImporter.Services;

public class FileParser
{
    public List<ImportedProblemDto> ParseFile(string filePath, string? format = null)
    {
        var detectedFormat = format ?? DetectFormat(filePath);
        
        return detectedFormat.ToLower() switch
        {
            "json" => ParseJson(filePath),
            "csv" => ParseCsv(filePath),
            _ => throw new ArgumentException($"Unsupported format: {detectedFormat}")
        };
    }

    private string DetectFormat(string filePath)
    {
        var extension = Path.GetExtension(filePath).ToLower();
        return extension switch
        {
            ".json" => "json",
            ".csv" => "csv",
            _ => throw new ArgumentException($"Cannot detect format from extension: {extension}")
        };
    }

    private List<ImportedProblemDto> ParseJson(string filePath)
    {
        var json = File.ReadAllText(filePath);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        return JsonSerializer.Deserialize<List<ImportedProblemDto>>(json, options) ?? new List<ImportedProblemDto>();
    }

    private List<ImportedProblemDto> ParseCsv(string filePath)
    {
        using var reader = new StringReader(File.ReadAllText(filePath));
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        return csv.GetRecords<ImportedProblemDto>().ToList();
    }
}