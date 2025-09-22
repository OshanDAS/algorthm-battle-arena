using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;

namespace AlgorithmBattleArina.Data
{
    public class DataContextDapper : IDataContextDapper
    {
        private readonly IConfiguration _config;

        public DataContextDapper(IConfiguration config)
        {
            _config = config;
        }

        private IDbConnection CreateConnection()
        {
            var connectionString = Environment.GetEnvironmentVariable("DefaultConnection") ?? 
                                  _config.GetConnectionString("DefaultConnection");
            return new SqlConnection(connectionString);
        }

        // Load multiple rows
        public IEnumerable<T> LoadData<T>(string sql, object? parameters = null)
        {
            using IDbConnection connection = CreateConnection();
            return connection.Query<T>(sql, parameters);
        }

        // Load single row (throws if not found or more than one)
        public T LoadDataSingle<T>(string sql, object? parameters = null)
        {
            using IDbConnection connection = CreateConnection();
            return connection.QuerySingle<T>(sql, parameters);
        }

        // Load optional single row (returns null if not found)
        public T? LoadDataSingleOrDefault<T>(string sql, object? parameters = null)
        {
            using IDbConnection connection = CreateConnection();
            return connection.QuerySingleOrDefault<T>(sql, parameters);
        }

        // Execute non-query (INSERT/UPDATE/DELETE) and return success/failure
        public bool ExecuteSql(string sql, object? parameters = null)
        {
            using IDbConnection connection = CreateConnection();
            return connection.Execute(sql, parameters) > 0;
        }

        // Execute non-query and return affected rows
        public int ExecuteSqlWithRowCount(string sql, object? parameters = null)
        {
            using IDbConnection connection = CreateConnection();
            return connection.Execute(sql, parameters);
        }

        // Execute multiple SQL commands as a transaction
        public bool ExecuteTransaction(List<(string sql, object? parameters)> sqlCommands)
        {
            using IDbConnection connection = CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                foreach (var (sql, parameters) in sqlCommands)
                {
                    connection.Execute(sql, parameters, transaction);
                }
                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                return false;
            }
        }
    }
}
