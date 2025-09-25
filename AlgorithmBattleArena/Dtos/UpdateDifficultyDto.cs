using System.Text.Json.Serialization;

namespace AlgorithmBattleArina.Dtos
{
    public class UpdateDifficultyDto
    {
        [JsonPropertyName("difficulty")]
        public string Difficulty { get; set; } = string.Empty;
    }
}
