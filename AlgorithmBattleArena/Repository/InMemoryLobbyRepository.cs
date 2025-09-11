using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using AlgorithmBattleArina.Repositories;

namespace AlgorithmBattleArina.Repositories
{
    /// <summary>
    /// Thread-safe in-memory lobby store.
    /// Structure:
    ///  - lobbyId => LobbyInfo
    /// LobbyInfo holds a map userId => set(connectionId).
    /// Note: uses locking per-lobby to simplify correctness.
    /// </summary>
    public class InMemoryLobbyRepository : ILobbyRepository
    {
        private class LobbyInfo
        {
            public readonly Dictionary<string, HashSet<string>> UserToConnections = new();
            public readonly object Lock = new();
            public string? HostUserId;
        }

        // lobbyId -> LobbyInfo
        private readonly ConcurrentDictionary<string, LobbyInfo> _lobbies = new();

        public void AddConnection(string lobbyId, string userId, string connectionId)
        {
            var info = _lobbies.GetOrAdd(lobbyId, _ => new LobbyInfo());
            lock (info.Lock)
            {
                if (!info.UserToConnections.TryGetValue(userId, out var set))
                {
                    set = new HashSet<string>();
                    info.UserToConnections[userId] = set;
                }
                set.Add(connectionId);
            }
        }

        public void RemoveConnection(string lobbyId, string connectionId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var info)) return;
            lock (info.Lock)
            {
                var usersToRemove = new List<string>();
                foreach (var kv in info.UserToConnections)
                {
                    var userId = kv.Key;
                    var set = kv.Value;
                    if (set.Remove(connectionId))
                    {
                        if (set.Count == 0) usersToRemove.Add(userId);
                        break;
                    }
                }

                foreach (var u in usersToRemove)
                    info.UserToConnections.Remove(u);

                // If lobby empty and no host, remove lobby entry to free memory
                if (info.UserToConnections.Count == 0 && info.HostUserId == null)
                    _lobbies.TryRemove(lobbyId, out _);
            }
        }

        public void RemoveConnectionFromAllLobbies(string connectionId)
        {
            foreach (var kv in _lobbies)
            {
                var lobbyId = kv.Key;
                RemoveConnection(lobbyId, connectionId);
            }
        }

        public IEnumerable<string> GetConnections(string lobbyId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var info)) return Enumerable.Empty<string>();
            lock (info.Lock)
            {
                return info.UserToConnections.Values.SelectMany(s => s).ToList();
            }
        }

        public bool IsMember(string lobbyId, string userId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var info)) return true; // permissive: allow join if lobby not tracked
            lock (info.Lock)
            {
                return info.UserToConnections.ContainsKey(userId);
            }
        }

        public bool IsHost(string lobbyId, string userId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var info)) return false;
            lock (info.Lock)
            {
                return info.HostUserId != null && info.HostUserId == userId;
            }
        }

        public void SetHost(string lobbyId, string userId)
        {
            var info = _lobbies.GetOrAdd(lobbyId, _ => new LobbyInfo());
            lock (info.Lock)
            {
                info.HostUserId = userId;
            }
        }
    }
}
