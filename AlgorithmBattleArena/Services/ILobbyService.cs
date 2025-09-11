using System.Collections.Generic;

namespace AlgorithmBattleArena.Services
{
    /// <summary>
    /// Minimal lobby service interface to manage lobby membership and connections.
    /// MVP: in-memory implementation provided. Replace with Redis / DB for scale.
    /// </summary>
    public interface ILobbyService
    {
        /// <summary>
        /// Add a connection id for a given lobby and user.
        /// </summary>
        void AddConnection(string lobbyId, string userId, string connectionId);

        /// <summary>
        /// Remove a specific connection id from the lobby.
        /// </summary>
        void RemoveConnection(string lobbyId, string connectionId);

        /// <summary>
        /// Remove a connection id from all lobbies (used on disconnect).
        /// </summary>
        void RemoveConnectionFromAllLobbies(string connectionId);

        /// <summary>
        /// Get active connection ids for a lobby.
        /// </summary>
        IEnumerable<string> GetConnections(string lobbyId);

        /// <summary>
        /// Return true if this user is allowed to join the lobby.
        /// For MVP this method will accept if the lobby doesn't exist yet; adapt for stricter rules.
        /// </summary>
        bool IsMember(string lobbyId, string userId);

        /// <summary>
        /// Used by MatchesController: check whether the user is the host/owner of the lobby.
        /// </summary>
        bool IsHost(string lobbyId, string userId);

        /// <summary>
        /// Optionally set the host for a lobby (when lobby is created).
        /// </summary>
        void SetHost(string lobbyId, string userId);
    }
}
