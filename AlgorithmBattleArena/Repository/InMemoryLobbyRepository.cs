using System.Collections.Concurrent;

namespace AlgorithmBattleArina.Repositories
{
    public class InMemoryLobbyRepository : ILobbyRepository
    {
        private readonly ConcurrentDictionary<string, Lobby> _lobbies = new();

        private class Lobby
        {
            public string Id { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string HostUserId { get; set; } = string.Empty;
            public int MaxPlayers { get; set; } = 10;
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
            public HashSet<string> Members { get; set; } = new();
            public Dictionary<string, HashSet<string>> UserConnections { get; set; } = new();
            public readonly object Lock = new();
        }

        public string CreateLobby(string hostUserId, string lobbyName, int maxPlayers = 10)
        {
            var lobbyId = Guid.NewGuid().ToString("N")[..8];
            var lobby = new Lobby
            {
                Id = lobbyId,
                Name = lobbyName,
                HostUserId = hostUserId,
                MaxPlayers = maxPlayers,
                CreatedAt = DateTime.UtcNow
            };
            
            lobby.Members.Add(hostUserId);
            _lobbies[lobbyId] = lobby;
            return lobbyId;
        }

        public bool JoinLobby(string lobbyId, string userId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var lobby)) return false;
            
            lock (lobby.Lock)
            {
                if (lobby.Members.Count >= lobby.MaxPlayers) return false;
                return lobby.Members.Add(userId);
            }
        }

        public bool LeaveLobby(string lobbyId, string userId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var lobby)) return false;
            
            lock (lobby.Lock)
            {
                lobby.Members.Remove(userId);
                lobby.UserConnections.Remove(userId);
                
                if (lobby.HostUserId == userId)
                {
                    lobby.HostUserId = lobby.Members.FirstOrDefault() ?? string.Empty;
                }
                
                if (lobby.Members.Count == 0)
                {
                    _lobbies.TryRemove(lobbyId, out _);
                }
                
                return true;
            }
        }

        public bool DeleteLobby(string lobbyId, string hostUserId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var lobby)) return false;
            if (lobby.HostUserId != hostUserId) return false;
            
            return _lobbies.TryRemove(lobbyId, out _);
        }

        public void AddConnection(string lobbyId, string userId, string connectionId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var lobby)) return;
            
            lock (lobby.Lock)
            {
                if (!lobby.UserConnections.TryGetValue(userId, out var connections))
                {
                    connections = new HashSet<string>();
                    lobby.UserConnections[userId] = connections;
                }
                connections.Add(connectionId);
            }
        }

        public void RemoveConnection(string lobbyId, string connectionId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var lobby)) return;
            
            lock (lobby.Lock)
            {
                foreach (var userConnections in lobby.UserConnections.Values)
                {
                    userConnections.Remove(connectionId);
                }
            }
        }

        public IEnumerable<string> RemoveConnectionFromAllLobbies(string connectionId)
        {
            var affectedLobbies = new List<string>();
            
            foreach (var kvp in _lobbies)
            {
                var lobbyId = kvp.Key;
                var lobby = kvp.Value;
                
                lock (lobby.Lock)
                {
                    bool removed = false;
                    foreach (var userConnections in lobby.UserConnections.Values)
                    {
                        if (userConnections.Remove(connectionId))
                        {
                            removed = true;
                        }
                    }
                    
                    if (removed)
                    {
                        affectedLobbies.Add(lobbyId);
                    }
                }
            }
            
            return affectedLobbies;
        }

        public IEnumerable<LobbyInfo> GetLobbies()
        {
            return _lobbies.Values.Select(lobby =>
            {
                lock (lobby.Lock)
                {
                    return new LobbyInfo
                    {
                        Id = lobby.Id,
                        Name = lobby.Name,
                        HostUserId = lobby.HostUserId,
                        MemberCount = lobby.Members.Count,
                        MaxPlayers = lobby.MaxPlayers,
                        IsActive = lobby.Members.Count > 0,
                        CreatedAt = lobby.CreatedAt,
                        Members = lobby.Members.ToList()
                    };
                }
            }).ToList();
        }

        public LobbyInfo? GetLobby(string lobbyId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var lobby)) return null;
            
            lock (lobby.Lock)
            {
                return new LobbyInfo
                {
                    Id = lobby.Id,
                    Name = lobby.Name,
                    HostUserId = lobby.HostUserId,
                    MemberCount = lobby.Members.Count,
                    MaxPlayers = lobby.MaxPlayers,
                    IsActive = lobby.Members.Count > 0,
                    CreatedAt = lobby.CreatedAt,
                    Members = lobby.Members.ToList()
                };
            }
        }

        public IEnumerable<string> GetLobbyMembers(string lobbyId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var lobby)) return Enumerable.Empty<string>();
            
            lock (lobby.Lock)
            {
                return lobby.Members.ToList();
            }
        }

        public bool IsMember(string lobbyId, string userId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var lobby)) return false;
            
            lock (lobby.Lock)
            {
                return lobby.Members.Contains(userId);
            }
        }

        public bool IsHost(string lobbyId, string userId)
        {
            if (!_lobbies.TryGetValue(lobbyId, out var lobby)) return false;
            
            lock (lobby.Lock)
            {
                return lobby.HostUserId == userId;
            }
        }
    }
}