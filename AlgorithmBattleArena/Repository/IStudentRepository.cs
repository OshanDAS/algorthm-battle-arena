using System.Collections.Generic;
using System.Threading.Tasks;
using AlgorithmBattleArina.Models;

namespace AlgorithmBattleArina.Repositories
{
    public interface IStudentRepository
    {
        Task<int> CreateRequest(int studentId, int teacherId);
        Task AcceptRequest(int requestId, int teacherId);
        Task RejectRequest(int requestId, int teacherId);
        Task<IEnumerable<Student>> GetStudentsByStatus(int teacherId, string status);
    }
}
