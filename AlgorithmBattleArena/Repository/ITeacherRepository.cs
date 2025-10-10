using System.Collections.Generic;
using System.Threading.Tasks;
using AlgorithmBattleArina.Models;

namespace AlgorithmBattleArina.Repositories
{
    public interface ITeacherRepository
    {
        Task<IEnumerable<Teacher>> GetTeachers();
    }
}
