using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Models;
using Dapper;
using System.Threading.Tasks;

namespace AlgorithmBattleArina.Repositories
{
    public class SubmissionRepository : ISubmissionRepository
    {
        private readonly IDataContextDapper _dapper;

        public SubmissionRepository(IDataContextDapper dapper)
        {
            _dapper = dapper;
        }

        public async Task<int> CreateSubmission(Submission submission)
        {
            var sql = @"INSERT INTO AlgorithmBattleArinaSchema.Submissions (MatchId, ProblemId, ParticipantEmail, Language, Code, Status) 
                        VALUES (@MatchId, @ProblemId, @ParticipantEmail, @Language, @Code, @Status);
                        SELECT CAST(SCOPE_IDENTITY() as int)";
            
            var parameters = new DynamicParameters();
            parameters.Add("@MatchId", submission.MatchId);
            parameters.Add("@ProblemId", submission.ProblemId);
            parameters.Add("@ParticipantEmail", submission.ParticipantEmail);
            parameters.Add("@Language", submission.Language);
            parameters.Add("@Code", submission.Code);
            parameters.Add("@Status", submission.Status);

            return await _dapper.LoadDataSingleAsync<int>(sql, parameters);
        }
    }
}
