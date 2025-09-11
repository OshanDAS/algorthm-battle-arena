using System.ComponentModel.DataAnnotations;

namespace AlgorithmBattleArina.Models
{
   public class Problem
    {
        public int ProblemId { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = null!;
        
        [Required]
        public string Description { get; set; } = null!;
        
        [Required]
        [MaxLength(50)]
        public string DifficultyLevel { get; set; } = null!;
        
        [Required]
        [MaxLength(100)]
        public string Category { get; set; } = null!;
        
        [Range(1, int.MaxValue)]
        public int TimeLimit { get; set; }
        
        [Range(1, int.MaxValue)]
        public int MemoryLimit { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = null!;
        
        public string Tags { get; set; } = null!; 
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}