using System.Collections.Generic;
using System.Threading.Tasks;
using AlgorithmBattleArena.Data;
using AlgorithmBattleArena.Models;
using Dapper;
using AlgorithmBattleArena.Dtos;

namespace AlgorithmBattleArena.Repositories
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

        public async Task<IEnumerable<StudentRequestDto>> GetStudentsByStatus(int teacherId, string status)
        {
            if (status.ToLower() == "accepted")
            {
                string sql = @"SELECT 0 AS RequestId, s.StudentId, s.FirstName, s.LastName, s.Email, s.Email AS Username FROM AlgorithmBattleArinaSchema.Student s WHERE s.TeacherId = @TeacherId";
                return await _dapper.LoadDataAsync<StudentRequestDto>(sql, new { TeacherId = teacherId });
            }
            else
            {
                string sql = @"SELECT r.RequestId, s.StudentId, s.FirstName, s.LastName, s.Email, s.Email AS Username FROM AlgorithmBattleArinaSchema.Student s JOIN AlgorithmBattleArinaSchema.StudentTeacherRequests r ON s.StudentId = r.StudentId WHERE r.TeacherId = @TeacherId AND r.Status = @Status";
                return await _dapper.LoadDataAsync<StudentRequestDto>(sql, new { TeacherId = teacherId, Status = status });
            }
        }

        public async Task<IEnumerable<TeacherDto>> GetAcceptedTeachers(int studentId)
        {
            string sql = @"SELECT t.TeacherId, t.FirstName, t.LastName, t.Email 
                          FROM AlgorithmBattleArinaSchema.Teachers t 
                          JOIN AlgorithmBattleArinaSchema.Student s ON t.TeacherId = s.TeacherId 
                          WHERE s.StudentId = @StudentId";
            return await _dapper.LoadDataAsync<TeacherDto>(sql, new { StudentId = studentId });
        }
    }
}
