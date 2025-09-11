using AlgorithmBattleArena.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AlgorithmBattleArena.Hubs
{
    /// <summary>
    /// SignalR hub for lobby operations and receiving MatchStarted broadcasts.
    /// Requires authentication (JWT).
    /// </summary>
    [Authorize]
    public class MatchHub : Hub
    {
        private readonly ILobbyService _lobbyService;

        public MatchHub(ILobbyService lobbyService)
        {
            _lobbyService = lobbyService;
        }

        private string? GetUserId()
        {
            // Prefer NameIdentifier
            var id = Context.UserIdentifier ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return id;
        }

        public override Task OnConnectedAsync()
        {
            // Optionally: log connection established
            // e.g. logger?.LogInformation("Connection {conn} established for user {user}", Context.ConnectionId, GetUserId());
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            // Remove connection from all lobbies to keep the in-memory store tidy.
            _lobbyService.RemoveConnectionFromAllLobbies(Context.ConnectionId);
            return base.OnDisconnectedAsync(exception);
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

            if (!_lobbyService.IsMember(lobbyId, userId))
                throw new HubException("User not authorized to join this lobby");

            await Groups.AddToGroupAsync(Context.ConnectionId, lobbyId);
            _lobbyService.AddConnection(lobbyId, userId, Context.ConnectionId);

            // Notify other members (optional)
            await Clients.Group(lobbyId).SendAsync("LobbyMemberJoined", new { UserId = userId, LobbyId = lobbyId });
        }

        public async Task LeaveLobby(string lobbyId)
        {
            var userId = GetUserId();
            if (string.IsNullOrEmpty(userId)) return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, lobbyId);
            _lobbyService.RemoveConnection(lobbyId, Context.ConnectionId);

            await Clients.Group(lobbyId).SendAsync("LobbyMemberLeft", new { UserId = userId, LobbyId = lobbyId });
        }
    }
}
