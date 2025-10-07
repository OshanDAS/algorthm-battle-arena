using System.Collections.Generic;
using System.Threading.Tasks;
using AlgorithmBattleArina.Data;
using AlgorithmBattleArina.Models;
using Dapper;

namespace AlgorithmBattleArina.Repositories
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
