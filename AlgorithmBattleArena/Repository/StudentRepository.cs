using System.Collections.Generic;
using System.Threading.Tasks;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Models;
using Dapper;

namespace AlgorithmBattleArina.Repositories
{
    public class StudentRepository : IStudentRepository
    {
        private readonly IDataContextDapper _dapper;

        public StudentRepository(IDataContextDapper dapper)
        {
            _dapper = dapper;
        }

        public async Task<int> CreateRequest(int studentId, int teacherId)
        {
            string sql = @"INSERT INTO AlgorithmBattleArinaSchema.StudentTeacherRequests (StudentId, TeacherId, Status) VALUES (@StudentId, @TeacherId, 'Pending');
                            SELECT CAST(SCOPE_IDENTITY() as int)";
            return await _dapper.LoadDataSingleAsync<int>(sql, new { StudentId = studentId, TeacherId = teacherId });
        }

        public async Task AcceptRequest(int requestId, int teacherId)
        {
            string sql1 = @"UPDATE AlgorithmBattleArinaSchema.StudentTeacherRequests SET Status = 'Accepted' WHERE RequestId = @RequestId AND TeacherId = @TeacherId;";
            string sql2 = @"UPDATE AlgorithmBattleArinaSchema.Student SET TeacherId = @TeacherId WHERE StudentId = (SELECT StudentId FROM AlgorithmBattleArinaSchema.StudentTeacherRequests WHERE RequestId = @RequestId)";
            var sqlCommands = new List<(string, object?)> { (sql1, new { RequestId = requestId, TeacherId = teacherId }), (sql2, new { RequestId = requestId, TeacherId = teacherId }) };
            await Task.Run(() => _dapper.ExecuteTransaction(sqlCommands));
        }

        public async Task RejectRequest(int requestId, int teacherId)
        {
            string sql = @"UPDATE AlgorithmBattleArinaSchema.StudentTeacherRequests SET Status = 'Rejected' WHERE RequestId = @RequestId AND TeacherId = @TeacherId;";
            await _dapper.ExecuteSqlAsync(sql, new { RequestId = requestId, TeacherId = teacherId });
        }

        public async Task<IEnumerable<Student>> GetStudentsByStatus(int teacherId, string status)
        {
            string sql = @"SELECT s.* FROM AlgorithmBattleArinaSchema.Student s JOIN AlgorithmBattleArinaSchema.StudentTeacherRequests r ON s.StudentId = r.StudentId WHERE r.TeacherId = @TeacherId AND r.Status = @Status";
            if (status.ToLower() == "accepted")
            {
                sql = @"SELECT * FROM AlgorithmBattleArinaSchema.Student WHERE TeacherId = @TeacherId";
                return await _dapper.LoadDataAsync<Student>(sql, new { TeacherId = teacherId });
            }
            return await _dapper.LoadDataAsync<Student>(sql, new { TeacherId = teacherId, Status = status });
        }
    }
}
