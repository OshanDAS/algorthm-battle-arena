using System.Collections.Generic;

namespace AlgorithmBattleArina.Repositories
{
    public interface ILobbyRepository
    {
        void AddConnection(string lobbyId, string userId, string connectionId);
        void RemoveConnection(string lobbyId, string connectionId);
        void RemoveConnectionFromAllLobbies(string connectionId);
        IEnumerable<string> GetConnections(string lobbyId);

        bool IsMember(string lobbyId, string userId);
        bool IsHost(string lobbyId, string userId);
        void SetHost(string lobbyId, string userId);

        // NEW: expose all known lobbies
        IEnumerable<LobbyInfo> GetLobbies();
    }

    /// <summary>
    /// Simple lobby data contract for listing.
    /// </summary>
    public class LobbyInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public bool IsActive { get; set; }
    }
}
