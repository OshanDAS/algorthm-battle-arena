using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Helpers;
using Dapper;

namespace AlgorithmBattleArina.Repositories
{
    public class AdminRepository : IAdminRepository
    {
        private readonly IDataContextDapper _dapper;

        public AdminRepository(IDataContextDapper dapper)
        {
            _dapper = dapper;
        }

        public async Task<PagedResult<AdminUserDto>> GetUsersAsync(string? q, string? role, int page, int pageSize)
        {
            var users = new List<AdminUserDto>();

            // Get students if no role filter or role is "Student"
            if (string.IsNullOrEmpty(role) || role == "Student")
            {
                var studentSql = @"
                    SELECT StudentId, FirstName, LastName, Email, Active 
                    FROM AlgorithmBattleArinaSchema.Student";
                
                var studentParams = new DynamicParameters();
                if (!string.IsNullOrEmpty(q))
                {
                    studentSql += " WHERE FirstName LIKE @Search OR LastName LIKE @Search OR Email LIKE @Search";
                    studentParams.Add("@Search", $"%{q}%");
                }

                var students = await _dapper.LoadDataAsync<dynamic>(studentSql, studentParams);
                users.AddRange(students.Select(s => new AdminUserDto
                {
                    Id = $"Student:{s.StudentId}",
                    Name = $"{s.FirstName} {s.LastName}".Trim(),
                    Email = s.Email,
                    Role = "Student",
                    IsActive = s.Active,
                    CreatedAt = DateTime.UtcNow
                }));
            }

            // Get teachers if no role filter or role is "Teacher"
            if (string.IsNullOrEmpty(role) || role == "Teacher")
            {
                var teacherSql = @"
                    SELECT TeacherId, FirstName, LastName, Email, Active 
                    FROM AlgorithmBattleArinaSchema.Teachers";
                
                var teacherParams = new DynamicParameters();
                if (!string.IsNullOrEmpty(q))
                {
                    teacherSql += " WHERE FirstName LIKE @Search OR LastName LIKE @Search OR Email LIKE @Search";
                    teacherParams.Add("@Search", $"%{q}%");
                }

                var teachers = await _dapper.LoadDataAsync<dynamic>(teacherSql, teacherParams);
                users.AddRange(teachers.Select(t => new AdminUserDto
                {
                    Id = $"Teacher:{t.TeacherId}",
                    Name = $"{t.FirstName} {t.LastName}".Trim(),
                    Email = t.Email,
                    Role = "Teacher",
                    IsActive = t.Active,
                    CreatedAt = DateTime.UtcNow
                }));
            }

            // Sort and paginate
            var sortedUsers = users.OrderByDescending(u => u.CreatedAt).ToList();
            var total = sortedUsers.Count;
            var pagedUsers = sortedUsers.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            return new PagedResult<AdminUserDto>
            {
                Items = pagedUsers,
                Total = total
            };
        }

        public async Task<AdminUserDto?> ToggleUserActiveAsync(string id, bool deactivate)
        {
            var (role, numericId) = ParseUserId(id);
            if (string.IsNullOrEmpty(role) || numericId == 0)
                return null;

            if (role == "Student")
            {
                const string sql = @"
                    UPDATE AlgorithmBattleArinaSchema.Student 
                    SET Active = @Active 
                    WHERE StudentId = @Id;
                    
                    SELECT StudentId, FirstName, LastName, Email, Active 
                    FROM AlgorithmBattleArinaSchema.Student 
                    WHERE StudentId = @Id";

                var student = await _dapper.LoadDataSingleOrDefaultAsync<dynamic>(sql, new 
                { 
                    Active = !deactivate, 
                    Id = numericId 
                });

                if (student == null) return null;

                return new AdminUserDto
                {
                    Id = $"Student:{student.StudentId}",
                    Name = $"{student.FirstName} {student.LastName}".Trim(),
                    Email = student.Email,
                    Role = "Student",
                    IsActive = student.Active,
                    CreatedAt = DateTime.UtcNow
                };
            }
            else if (role == "Teacher")
            {
                const string sql = @"
                    UPDATE AlgorithmBattleArinaSchema.Teachers 
                    SET Active = @Active 
                    WHERE TeacherId = @Id;
                    
                    SELECT TeacherId, FirstName, LastName, Email, Active 
                    FROM AlgorithmBattleArinaSchema.Teachers 
                    WHERE TeacherId = @Id";

                var teacher = await _dapper.LoadDataSingleOrDefaultAsync<dynamic>(sql, new 
                { 
                    Active = !deactivate, 
                    Id = numericId 
                });

                if (teacher == null) return null;

                return new AdminUserDto
                {
                    Id = $"Teacher:{teacher.TeacherId}",
                    Name = $"{teacher.FirstName} {teacher.LastName}".Trim(),
                    Email = teacher.Email,
                    Role = "Teacher",
                    IsActive = teacher.Active,
                    CreatedAt = DateTime.UtcNow
                };
            }

            return null;
        }

        private (string role, int id) ParseUserId(string userId)
        {
            if (userId.Contains(':'))
            {
                var parts = userId.Split(':');
                if (parts.Length == 2 && int.TryParse(parts[1], out int id))
                {
                    return (parts[0], id);
                }
            }
            return ("", 0);
        }
    }
}