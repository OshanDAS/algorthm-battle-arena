using System;

namespace AlgorithmBattleArina.Models
{
    /// <summary>
    /// Request body for starting a match in a lobby.
    /// </summary>
    public class StartMatchRequest
    {
        public Guid ProblemId { get; set; }
        public int DurationSec { get; set; }

        /// <summary>
        /// Buffer in seconds to allow clients to receive the broadcast before the start time.
        /// Default 5 seconds.
        /// </summary>
        public int PreparationBufferSec { get; set; } = 5;
    }
}
