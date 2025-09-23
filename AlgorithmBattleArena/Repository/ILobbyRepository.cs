using System.Collections.Generic;

namespace AlgorithmBattleArina.Repositories
{
    public interface ILobbyRepository
    {
        // Lobby Management
        string CreateLobby(string hostUserId, string lobbyName, int maxPlayers = 10);
        bool JoinLobby(string lobbyId, string userId);
        bool LeaveLobby(string lobbyId, string userId);
        bool DeleteLobby(string lobbyId, string hostUserId);
        
        // Connection Management (SignalR)
        void AddConnection(string lobbyId, string userId, string connectionId);
        void RemoveConnection(string lobbyId, string connectionId);
        IEnumerable<string> RemoveConnectionFromAllLobbies(string connectionId);
        
        // Query Methods
        IEnumerable<LobbyInfo> GetLobbies();
        LobbyInfo? GetLobby(string lobbyId);
        IEnumerable<string> GetLobbyMembers(string lobbyId);
        
        // Authorization
        bool IsMember(string lobbyId, string userId);
        bool IsHost(string lobbyId, string userId);
    }

    public class LobbyInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string HostUserId { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public int MaxPlayers { get; set; } = 10;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> Members { get; set; } = new();
    }
}