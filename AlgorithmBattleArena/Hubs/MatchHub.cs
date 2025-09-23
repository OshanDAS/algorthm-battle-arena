using AlgorithmBattleArina.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Linq;                 // <-- added
using System.Security.Claims;
using System.Threading.Tasks;

namespace AlgorithmBattleArina.Hubs
{
    /// <summary>
    /// SignalR hub for lobby operations and receiving MatchStarted broadcasts.
    /// Requires authentication (JWT).
    /// </summary>
    [Authorize]
    public class MatchHub : Hub
    {
        private readonly ILobbyRepository _lobbyRepository;

        public MatchHub(ILobbyRepository lobbyRepository)
        {
            _lobbyRepository = lobbyRepository;
        }

        private string? GetUserId()
        {
            // Prefer NameIdentifier
            var id = Context.UserIdentifier ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return id;
        }

        public Task<string> Ping()
        {
            return Task.FromResult("pong");
        }

        public override Task OnConnectedAsync()
        {
            // Optionally: log connection established
            // e.g. logger?.LogInformation("Connection {conn} established for user {user}", Context.ConnectionId, GetUserId());
            return base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Remove connection from all lobbies to keep the in-memory store tidy.
            // Capture the list of lobbies affected so we can broadcast updated counts
            var affectedLobbyIds = _lobbyRepository.RemoveConnectionFromAllLobbies(Context.ConnectionId);

            // If repository returns affectedLobbyIds (adjust repo signature to return IEnumerable<string>), broadcast updates
            if (affectedLobbyIds != null)
            {
                foreach (var lobbyId in affectedLobbyIds)
                {
                    var lobbyInfo = BuildLobbyInfo(lobbyId);
                    if (lobbyInfo != null)
                        await Clients.Group(lobbyId).SendAsync("LobbyUpdated", lobbyInfo);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Join a lobby. Requires that the authenticated user is allowed to join.
        /// Throws HubException for unauthorized attempts (client receives the error).
        /// </summary>
        public async Task JoinLobby(string lobbyId)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            if (!_lobbyRepository.IsMember(lobbyId, userId))
                throw new HubException("User not authorized to join this lobby");

            await Groups.AddToGroupAsync(Context.ConnectionId, lobbyId);
            _lobbyRepository.AddConnection(lobbyId, userId, Context.ConnectionId);

            // Broadcast updated lobby info (authoritative member count) to the group
            var lobbyInfo = BuildLobbyInfo(lobbyId);
            if (lobbyInfo != null)
                await Clients.Group(lobbyId).SendAsync("LobbyUpdated", lobbyInfo);

            // Optional: also send an event about who joined (useful for ephemeral UI/notifications)
            await Clients.Group(lobbyId).SendAsync("LobbyMemberJoined", new { UserId = userId, LobbyId = lobbyId });
        }

        public async Task LeaveLobby(string lobbyId)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, lobbyId);
            _lobbyRepository.RemoveConnection(lobbyId, Context.ConnectionId);

            // Broadcast updated lobby info (authoritative member count)
            var lobbyInfo = BuildLobbyInfo(lobbyId);
            if (lobbyInfo != null)
                await Clients.Group(lobbyId).SendAsync("LobbyUpdated", lobbyInfo);

            await Clients.Group(lobbyId).SendAsync("LobbyMemberLeft", new { UserId = userId, LobbyId = lobbyId });
        }

        /// <summary>
        /// Host-only: start a match for the lobby. Broadcasts MatchStarted to all members in the group.
        /// </summary>
        public async Task StartMatch(string lobbyId, string matchId, string problemId, DateTime startAt, int durationSec)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            if (!_lobbyRepository.IsHost(lobbyId, userId))
                throw new HubException("Only the host can start the match");

            var payload = new
            {
                matchId,
                problemId,
                startAt = startAt.ToUniversalTime(), // ensure UTC
                durationSec
            };

            await Clients.Group(lobbyId).SendAsync("MatchStarted", payload);
        }

        /// <summary>
        /// Helper: build reliable LobbyInfo object with current member count.
        /// </summary>
        private LobbyInfo? BuildLobbyInfo(string lobbyId)
        {
            return _lobbyRepository.GetLobby(lobbyId);
        }
    }
}
