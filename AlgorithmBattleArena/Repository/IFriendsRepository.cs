using AlgorithmBattleArina.Dtos;

namespace AlgorithmBattleArina.Repositories
{
    public interface IFriendsRepository
    {
        Task<IEnumerable<FriendDto>> GetFriendsAsync(int studentId);
        Task<IEnumerable<FriendDto>> SearchStudentsAsync(string query, int currentStudentId);
        Task<int> SendFriendRequestAsync(int senderId, int receiverId);
        Task<IEnumerable<FriendRequestDto>> GetReceivedRequestsAsync(int studentId);
        Task<IEnumerable<FriendRequestDto>> GetSentRequestsAsync(int studentId);
        Task AcceptFriendRequestAsync(int requestId, int studentId);
        Task RejectFriendRequestAsync(int requestId, int studentId);
        Task RemoveFriendAsync(int studentId, int friendId);
    }
}