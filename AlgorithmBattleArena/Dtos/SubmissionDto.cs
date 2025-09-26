namespace AlgorithmBattleArina.Dtos
{
    public class SubmissionDto
    {
        public int MatchId { get; set; }
        public int ProblemId { get; set; }
        public string Language { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}
