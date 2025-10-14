using System.Collections.Generic;
using System.Threading.Tasks;
using AlgorithmBattleArena.Data;
using AlgorithmBattleArena.Models;
using Dapper;

namespace AlgorithmBattleArena.Repositories
{
    public class TeacherRepository : ITeacherRepository
    {
        private readonly IDataContextDapper _dapper;

        public TeacherRepository(IDataContextDapper dapper)
        {
            _dapper = dapper;
        }

        public async Task<IEnumerable<Teacher>> GetTeachers()
        {
            string sql = @"SELECT * FROM AlgorithmBattleArinaSchema.Teachers";
            return await _dapper.LoadDataAsync<Teacher>(sql);
        }
    }
}
