using AlgorithmBattleArina.Hubs;
using AlgorithmBattleArina.Models;
using AlgorithmBattleArina.Repositories;
using AlgorithmBattleArina.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Security.Claims;
using System.Threading.Tasks;


namespace AlgorithmBattleArina.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Must be authenticated (JWT)
    public class MatchesController : ControllerBase
    {
        private readonly IHubContext<MatchHub> _hubContext;
        private readonly ILobbyRepository _lobbyRepository;

        public MatchesController(IHubContext<MatchHub> hubContext, ILobbyRepository lobbyRepository)
        {
            _hubContext = hubContext;
            _lobbyRepository = lobbyRepository;
        }

        /// <summary>
        /// Start a match for the given lobbyId.
        /// The caller must be the host for that lobby (IsHost check).
        /// Broadcasts a single MatchStarted DTO to the lobby group.
        /// </summary>
        [HttpPost("{lobbyId}/start")]
        public async Task<IActionResult> StartMatch(string lobbyId, [FromBody] StartMatchRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Ensure caller is host of the lobby
            if (!_lobbyRepository.IsHost(lobbyId, userId))
                return Forbid();

            // Compute a single StartAtUtc for all participants.
            var bufferSec = Math.Max(1, request.PreparationBufferSec);
            var startAtUtc = DateTime.UtcNow.AddSeconds(bufferSec);

            var dto = new MatchStartedDto
            {
                MatchId = Guid.NewGuid(),
                ProblemId = request.ProblemId,
                StartAtUtc = startAtUtc,
                DurationSec = request.DurationSec,
                SentAtUtc = DateTime.UtcNow
            };

            // Broadcast to the SignalR group representing the lobby.
            await _hubContext.Clients.Group(lobbyId).SendAsync("MatchStarted", dto);

            return Ok(dto);
        }
    }
}
