using AlgorithmBattleArina.Models;
using System.Threading.Tasks;

namespace AlgorithmBattleArina.Repositories
{
    public interface ISubmissionRepository
    {
        Task<int> CreateSubmission(Submission submission);
        Task<IEnumerable<Submission>> GetSubmissionsByMatchAndUser(int matchId, string userEmail);
    }
}
