using System.ComponentModel.DataAnnotations;

namespace AlgorithmBattleArina.Models
{
   public class ProblemTestCase
    {
        public int TestCaseId { get; set; }
        
        [Required]
        public int ProblemId { get; set; }
        
        [Required]
        public string InputData { get; set; } = null!;
        
        [Required]
        public string ExpectedOutput { get; set; } = null!;
        
        public bool IsSample { get; set; }
        
        
        public virtual Problem? Problem { get; set; }
    }
}