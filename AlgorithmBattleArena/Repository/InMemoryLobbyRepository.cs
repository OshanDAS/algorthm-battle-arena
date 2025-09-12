using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace AlgorithmBattleArina.Repositories
{
    /// <summary>
    /// Thread-safe in-memory lobby store.
    /// </summary>
    public class InMemoryLobbyRepository : ILobbyRepository
    {
        private class InternalLobbyInfo
        {
            public readonly Dictionary<string, HashSet<string>> UserToConnections = new();
            public readonly object Lock = new();
            public string? HostUserId;
        }

        private readonly ConcurrentDictionary<string, InternalLobbyInfo> _lobbies = new();

        public InMemoryLobbyRepository()
        {
            // Seed sample lobbies for UI/testing
            var id1 = "arena-1";
            var info1 = new InternalLobbyInfo();
            info1.UserToConnections["user_a"] = new HashSet<string> { "conn-a1" };
            info1.UserToConnections["user_b"] = new HashSet<string> { "conn-b1" };
            info1.HostUserId = "user_a";
            _lobbies[id1] = info1;

            var id2 = "arena-2";
            var info2 = new InternalLobbyInfo();
            info2.UserToConnections["spectator1"] = new HashSet<string> { "conn-s1" };
            info2.HostUserId = null;
            _lobbies[id2] = info2;
        }

        public void AddConnection(string lobbyId, string userId, string connectionId)
        {
            var info = _lobbies.GetOrAdd(lobbyId, _ => new InternalLobbyInfo());
            lock (info.Lock)
            {
                if (!info.UserToConnections.TryGetValue(userId, out var set))
                {
                    set = new HashSet<string>();
                    info.UserToConnections[userId] = set;
                }
                set.Add(connectionId);

                // OPTIONAL: if this is the first member and there's no host, assign host to the first connector.
                // Remove or change this if you manage hosts elsewhere.
                if (info.HostUserId == null)
                {
                    info.HostUserId = userId;
                }
            }
        }

        public void RemoveConnection(string lobbyId, string connectionId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var info)) return;
            lock (info.Lock)
            {
                string? removedUser = null;
                foreach (var kv in info.UserToConnections)
                {
                    var user = kv.Key;
                    var set = kv.Value;
                    if (set.Remove(connectionId))
                    {
                        if (set.Count == 0) removedUser = user;
                        break;
                    }
                }

                if (removedUser != null)
                {
                    info.UserToConnections.Remove(removedUser);

                    // if the removed user was the host, clear host (or choose a new host)
                    if (info.HostUserId == removedUser)
                    {
                        info.HostUserId = info.UserToConnections.Keys.FirstOrDefault(); // promote another member or null
                    }
                }

                if (info.UserToConnections.Count == 0 && info.HostUserId == null)
                    _lobbies.TryRemove(lobbyId, out _);
            }
        }

        // Changed: return affected lobby ids so caller (hub) can broadcast updates for those lobbies.
        public IEnumerable<string> RemoveConnectionFromAllLobbies(string connectionId)
        {
            var affected = new List<string>();

            foreach (var kv in _lobbies.ToArray())
            {
                var lobbyId = kv.Key;
                var beforeCount = kv.Value.UserToConnections.Count;

                RemoveConnection(lobbyId, connectionId);

                // If the lobby existed before and now either changed or was removed, add to affected list.
                // We'll determine change by comparing counts again.
                if (_lobbies.TryGetValue(lobbyId, out var infoAfter))
                {
                    var afterCount = infoAfter.UserToConnections.Count;
                    if (afterCount != beforeCount)
                        affected.Add(lobbyId);
                }
                else
                {
                    // lobby removed entirely
                    affected.Add(lobbyId);
                }
            }

            return affected;
        }

        public IEnumerable<string> GetConnections(string lobbyId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var info)) return Enumerable.Empty<string>();
            lock (info.Lock)
            {
                return info.UserToConnections.Values.SelectMany(s => s).ToList();
            }
        }

        // Fixed: If lobby not found, return false (do not implicitly allow unknown lobbies).
        // If your design expects open lobbies (anyone can join a non-existent lobby), change to return true instead.
        public bool IsMember(string lobbyId, string userId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var info)) return false;
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
            var info = _lobbies.GetOrAdd(lobbyId, _ => new InternalLobbyInfo());
            lock (info.Lock)
            {
                info.HostUserId = userId;
            }
        }

        // --- map internal to public LobbyInfo DTO ---
        public IEnumerable<LobbyInfo> GetLobbies()
        {
            // Debug log so you can confirm at runtime this method is running
            Console.WriteLine("[InMemoryLobbyRepository] GetLobbies called - returning snapshot");

            var snapshot = _lobbies.ToArray();
            var result = new List<LobbyInfo>(snapshot.Length);

            foreach (var kv in snapshot)
            {
                var lobbyId = kv.Key;
                var info = kv.Value;

                int memberCount;
                int connectionCount;
                string? host;

                lock (info.Lock)
                {
                    memberCount = info.UserToConnections.Count;
                    connectionCount = info.UserToConnections.Values.Sum(s => s.Count);
                    host = info.HostUserId;
                }

                result.Add(new LobbyInfo
                {
                    Id = lobbyId,
                    Name = $"Lobby {lobbyId}",
                    MemberCount = memberCount,
                    IsActive = memberCount > 0 || host != null
                });
            }

            return result;
        }
    }
}
