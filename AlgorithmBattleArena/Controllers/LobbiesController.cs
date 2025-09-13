using AlgorithmBattleArina.Repositories;
using AlgorithmBattleArina.Attributes;
using AlgorithmBattleArina.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AlgorithmBattleArina.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LobbiesController : ControllerBase
    {
        private readonly ILobbyRepository _lobbyRepository;
        private readonly AuthHelper _authHelper;

        public LobbiesController(ILobbyRepository lobbyRepository, AuthHelper authHelper)
        {
            _lobbyRepository = lobbyRepository;
            _authHelper = authHelper;
        }

        [StudentOrAdmin]
        [HttpGet]
        public IActionResult GetLobbies()
        {
            var lobbies = _lobbyRepository.GetLobbies();
            return Ok(lobbies);
        }

        [StudentOrAdmin]
        [HttpGet("{lobbyId}")]
        public IActionResult GetLobby(string lobbyId)
        {
            var lobby = _lobbyRepository.GetLobby(lobbyId);
            if (lobby == null) return NotFound();
            return Ok(lobby);
        }

        [StudentOrAdmin]
        [HttpPost]
        public IActionResult CreateLobby([FromBody] CreateLobbyRequest request)
        {
            var role = _authHelper.GetRoleFromClaims(User);
            var userId = _authHelper.GetUserIdFromClaims(User, role ?? "")?.ToString();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var lobbyId = _lobbyRepository.CreateLobby(userId, request.Name, request.MaxPlayers);
            var lobby = _lobbyRepository.GetLobby(lobbyId);
            
            return CreatedAtAction(nameof(GetLobby), new { lobbyId }, lobby);
        }

        [StudentOrAdmin]
        [HttpPost("{lobbyId}/join")]
        public IActionResult JoinLobby(string lobbyId)
        {
            var role = _authHelper.GetRoleFromClaims(User);
            var userId = _authHelper.GetUserIdFromClaims(User, role ?? "")?.ToString();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var success = _lobbyRepository.JoinLobby(lobbyId, userId);
            if (!success) return BadRequest("Cannot join lobby");

            return Ok(new { message = "Joined lobby successfully" });
        }

        [StudentOrAdmin]
        [HttpPost("{lobbyId}/leave")]
        public IActionResult LeaveLobby(string lobbyId)
        {
            var role = _authHelper.GetRoleFromClaims(User);
            var userId = _authHelper.GetUserIdFromClaims(User, role ?? "")?.ToString();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var success = _lobbyRepository.LeaveLobby(lobbyId, userId);
            if (!success) return BadRequest("Cannot leave lobby");

            return Ok(new { message = "Left lobby successfully" });
        }

        [StudentOrAdmin]
        [HttpDelete("{lobbyId}")]
        public IActionResult DeleteLobby(string lobbyId)
        {
            var role = _authHelper.GetRoleFromClaims(User);
            var userId = _authHelper.GetUserIdFromClaims(User, role ?? "")?.ToString();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var success = _lobbyRepository.DeleteLobby(lobbyId, userId);
            if (!success) return Forbid("Only host can delete lobby");

            return Ok(new { message = "Lobby deleted successfully" });
        }
    }

    public class CreateLobbyRequest
    {
        public string Name { get; set; } = string.Empty;
        public int MaxPlayers { get; set; } = 10;
    }
}