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
using AlgorithmBattleArina.Helpers;

namespace AlgorithmBattleArina.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Must be authenticated (JWT)
    public class MatchesController : ControllerBase
    {
        private readonly IHubContext<MatchHub> _hubContext;
        private readonly ILobbyRepository _lobbyRepository;
        private readonly AuthHelper _authHelper;

        public MatchesController(IHubContext<MatchHub> hubContext, ILobbyRepository lobbyRepository, AuthHelper authHelper)
        {
            _hubContext = hubContext;
            _lobbyRepository = lobbyRepository;
            _authHelper = authHelper;
        }

        /// <summary>
        /// Start a match for the given lobbyId.
        /// The caller must be the host for that lobby (IsHost check).
        /// Broadcasts a single MatchStarted DTO to the lobby group.
        /// </summary>
        [HttpPost("{lobbyId:int}/start")]
        public async Task<IActionResult> StartMatch(int lobbyId, [FromBody] StartMatchRequest request)
        {
            var userEmail = _authHelper.GetEmailFromClaims(User);
            if (string.IsNullOrEmpty(userEmail))
                return Unauthorized();

            // Ensure caller is host of the lobby
            if (!await _lobbyRepository.IsHost(lobbyId, userEmail))
                return Forbid("Only the host can start the match.");

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
            await _hubContext.Clients.Group(lobbyId.ToString()).SendAsync("MatchStarted", dto);

            // Update lobby status
            await _lobbyRepository.UpdateLobbyStatus(lobbyId, "InProgress");

            return Ok(dto);
        }
    }
}
