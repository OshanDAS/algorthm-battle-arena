using System.Collections.Generic;

namespace AlgorithmBattleArina.Data
{
    public interface IDataContextDapper
    {
        IEnumerable<T> LoadData<T>(string sql, object? parameters = null);
        T LoadDataSingle<T>(string sql, object? parameters = null);
        T? LoadDataSingleOrDefault<T>(string sql, object? parameters = null);
        bool ExecuteSql(string sql, object? parameters = null);
        int ExecuteSqlWithRowCount(string sql, object? parameters = null);
        bool ExecuteTransaction(List<(string sql, object? parameters)> sqlCommands);
    }
}
