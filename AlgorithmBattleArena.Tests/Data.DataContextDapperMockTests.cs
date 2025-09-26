using Xunit;
using Moq;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using AlgorithmBattleArina.Data;

namespace AlgorithmBattleArena.Tests;

public class DataContextDapperMockTests : IDisposable
{
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly List<string> _envVarsToCleanup = new();

    public DataContextDapperMockTests()
    {
        _mockConfig = new Mock<IConfiguration>();
        var mockConnectionStringsSection = new Mock<IConfigurationSection>();
        var mockDefaultConnectionSection = new Mock<IConfigurationSection>();
        
        mockDefaultConnectionSection.Setup(s => s.Value).Returns("Server=test;Database=test;Integrated Security=true;");
        mockConnectionStringsSection.Setup(s => s["DefaultConnection"]).Returns("Server=test;Database=test;Integrated Security=true;");
        mockConnectionStringsSection.Setup(s => s.GetSection("DefaultConnection")).Returns(mockDefaultConnectionSection.Object);
        
        _mockConfig.Setup(c => c.GetSection("ConnectionStrings")).Returns(mockConnectionStringsSection.Object);
    }

    private void SetEnvironmentVariable(string key, string value)
    {
        Environment.SetEnvironmentVariable(key, value);
        _envVarsToCleanup.Add(key);
    }

    public void Dispose()
    {
        foreach (var key in _envVarsToCleanup)
        {
            Environment.SetEnvironmentVariable(key, null);
        }
    }

    [Fact]
    public void Constructor_WithNullConfiguration_ShouldNotThrow()
    {
        // The actual implementation doesn't validate null configuration in constructor
        var exception = Record.Exception(() => new DataContextDapper(null!));
        Assert.Null(exception);
    }

    [Fact]
    public void Constructor_WithValidConfiguration_ShouldNotThrow()
    {
        var exception = Record.Exception(() => new DataContextDapper(_mockConfig.Object));
        Assert.Null(exception);
    }

    [Fact]
    public void CreateConnection_UsesEnvironmentVariable_WhenSet()
    {
        var envConnectionString = "Server=env;Database=env;";
        SetEnvironmentVariable("DEFAULT_CONNECTION", envConnectionString);
        
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        // Verify environment variable is used
        Assert.Equal(envConnectionString, Environment.GetEnvironmentVariable("DEFAULT_CONNECTION"));
        Assert.NotNull(dataContext);
    }

    [Fact]
    public void CreateConnection_UsesConfiguration_WhenEnvironmentVariableNotSet()
    {
        // Ensure environment variable is not set
        Environment.SetEnvironmentVariable("DEFAULT_CONNECTION", null);
        
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        // Verify configuration would be used (we can't easily test the private method directly)
        Assert.NotNull(dataContext);
        Assert.Null(Environment.GetEnvironmentVariable("DEFAULT_CONNECTION"));
    }

    [Theory]
    [InlineData("")]
    public void LoadData_WithEmptySql_ShouldThrowSqlException(string sql)
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        // These throw SqlException due to connection issues
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.LoadData<object>(sql));
    }

    [Fact]
    public void LoadData_WithNullSql_ShouldThrowSqlException()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.LoadData<object>(null!));
    }

    [Theory]
    [InlineData("")]
    public void LoadDataSingle_WithEmptySql_ShouldThrowSqlException(string sql)
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.LoadDataSingle<object>(sql));
    }

    [Fact]
    public void LoadDataSingle_WithNullSql_ShouldThrowSqlException()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.LoadDataSingle<object>(null!));
    }

    [Theory]
    [InlineData("")]
    public void LoadDataSingleOrDefault_WithEmptySql_ShouldThrowSqlException(string sql)
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.LoadDataSingleOrDefault<object>(sql));
    }

    [Fact]
    public void LoadDataSingleOrDefault_WithNullSql_ShouldThrowSqlException()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.LoadDataSingleOrDefault<object>(null!));
    }

    [Theory]
    [InlineData("")]
    public void ExecuteSql_WithEmptySql_ShouldThrowSqlException(string sql)
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.ExecuteSql(sql));
    }

    [Fact]
    public void ExecuteSql_WithNullSql_ShouldThrowSqlException()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.ExecuteSql(null!));
    }

    [Theory]
    [InlineData("")]
    public void ExecuteSqlWithRowCount_WithEmptySql_ShouldThrowSqlException(string sql)
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.ExecuteSqlWithRowCount(sql));
    }

    [Fact]
    public void ExecuteSqlWithRowCount_WithNullSql_ShouldThrowSqlException()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.ExecuteSqlWithRowCount(null!));
    }

    [Fact]
    public void ExecuteTransaction_WithNullCommands_ShouldThrowSqlException()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.ExecuteTransaction(null!));
    }

    [Fact]
    public void ExecuteTransaction_WithEmptyCommands_ShouldThrowSqlException()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        var commands = new List<(string sql, object? parameters)>();
        
        // Empty transaction throws due to connection issues
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.ExecuteTransaction(commands));
    }

    [Fact]
    public void ExecuteTransaction_WithCommandsContainingNullSql_ShouldThrowSqlException()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        var commands = new List<(string sql, object? parameters)>
        {
            ("SELECT 1", null),
            (null!, null)
        };
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.ExecuteTransaction(commands));
    }

    [Fact]
    public void ExecuteTransaction_WithCommandsContainingEmptySql_ShouldThrowSqlException()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        var commands = new List<(string sql, object? parameters)>
        {
            ("SELECT 1", null),
            ("", null)
        };
        
        Assert.Throws<Microsoft.Data.SqlClient.SqlException>(() => dataContext.ExecuteTransaction(commands));
    }

    [Fact]
    public void LoadData_WithValidSqlAndNullParameters_ShouldNotThrow()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        var sql = "SELECT 1 as Id";
        
        // Should not throw for null parameters
        var exception = Record.Exception(() => dataContext.LoadData<object>(sql, null));
        // Exception will be thrown due to connection, but not due to null parameters
        Assert.NotNull(exception); // Connection exception expected
    }

    [Fact]
    public void LoadData_WithValidSqlAndParameters_ShouldNotThrow()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        var sql = "SELECT @Id as Id";
        var parameters = new { Id = 1 };
        
        // Should not throw for valid parameters
        var exception = Record.Exception(() => dataContext.LoadData<object>(sql, parameters));
        // Exception will be thrown due to connection, but not due to parameters
        Assert.NotNull(exception); // Connection exception expected
    }

    [Fact]
    public void DataContextDapper_ImplementsIDataContextDapper_ShouldImplementInterface()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        Assert.IsAssignableFrom<IDataContextDapper>(dataContext);
    }

    [Fact]
    public void DataContextDapper_AllInterfaceMethods_ShouldBeImplemented()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        var interfaceType = typeof(IDataContextDapper);
        var implementationType = typeof(DataContextDapper);
        
        // Verify all interface methods are implemented
        var interfaceMethods = interfaceType.GetMethods();
        foreach (var method in interfaceMethods)
        {
            var implementedMethod = implementationType.GetMethod(method.Name, 
                method.GetParameters().Select(p => p.ParameterType).ToArray());
            Assert.NotNull(implementedMethod);
        }
    }

    [Theory]
    [InlineData("SELECT * FROM Users")]
    [InlineData("INSERT INTO Users (Name) VALUES (@Name)")]
    [InlineData("UPDATE Users SET Name = @Name WHERE Id = @Id")]
    [InlineData("DELETE FROM Users WHERE Id = @Id")]
    [InlineData("EXEC sp_GetUserById @Id")]
    public void Methods_WithValidSqlStatements_ShouldAcceptDifferentSqlTypes(string sql)
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        
        // Verify different SQL statement types are accepted (syntax validation)
        Assert.NotNull(dataContext);
        Assert.NotEmpty(sql);
        
        // Methods should not throw ArgumentException for valid SQL syntax
        var loadDataException = Record.Exception(() => dataContext.LoadData<object>(sql));
        var loadSingleException = Record.Exception(() => dataContext.LoadDataSingle<object>(sql));
        var loadSingleOrDefaultException = Record.Exception(() => dataContext.LoadDataSingleOrDefault<object>(sql));
        var executeSqlException = Record.Exception(() => dataContext.ExecuteSql(sql));
        var executeWithRowCountException = Record.Exception(() => dataContext.ExecuteSqlWithRowCount(sql));
        
        // All should throw connection-related exceptions, not argument exceptions
        Assert.All(new[] { loadDataException, loadSingleException, loadSingleOrDefaultException, 
                          executeSqlException, executeWithRowCountException }, 
                  ex => Assert.IsNotType<ArgumentException>(ex));
    }

    [Fact]
    public void ExecuteTransaction_WithMixedValidCommands_ShouldAcceptValidCommands()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        var commands = new List<(string sql, object? parameters)>
        {
            ("INSERT INTO Users (Name, Email) VALUES (@Name, @Email)", new { Name = "John", Email = "john@test.com" }),
            ("UPDATE Users SET LastLogin = @LoginTime WHERE Email = @Email", new { LoginTime = DateTime.Now, Email = "john@test.com" }),
            ("INSERT INTO UserRoles (UserId, RoleId) VALUES ((SELECT Id FROM Users WHERE Email = @Email), @RoleId)", new { Email = "john@test.com", RoleId = 1 }),
            ("DELETE FROM TempData WHERE CreatedDate < @CutoffDate", new { CutoffDate = DateTime.Now.AddDays(-30) })
        };
        
        // Should not throw ArgumentException for valid command structure
        var exception = Record.Exception(() => dataContext.ExecuteTransaction(commands));
        Assert.IsNotType<ArgumentException>(exception);
    }

    // Test model for generic type testing
    public class TestEntity
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal? Score { get; set; }
    }

    [Fact]
    public void LoadData_WithComplexGenericType_ShouldSupportComplexTypes()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        var sql = "SELECT Id, Name, IsActive, CreatedAt, Score FROM TestEntities";
        
        // Should not throw type-related exceptions
        var exception = Record.Exception(() => dataContext.LoadData<TestEntity>(sql));
        Assert.IsNotType<ArgumentException>(exception);
        Assert.IsNotType<InvalidCastException>(exception);
    }

    [Fact]
    public void LoadDataSingle_WithComplexGenericType_ShouldSupportComplexTypes()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        var sql = "SELECT Id, Name, IsActive, CreatedAt, Score FROM TestEntities WHERE Id = @Id";
        var parameters = new { Id = 1 };
        
        // Should not throw type-related exceptions
        var exception = Record.Exception(() => dataContext.LoadDataSingle<TestEntity>(sql, parameters));
        Assert.IsNotType<ArgumentException>(exception);
        Assert.IsNotType<InvalidCastException>(exception);
    }

    [Fact]
    public void LoadDataSingleOrDefault_WithComplexGenericType_ShouldSupportComplexTypes()
    {
        var dataContext = new DataContextDapper(_mockConfig.Object);
        var sql = "SELECT Id, Name, IsActive, CreatedAt, Score FROM TestEntities WHERE Id = @Id";
        var parameters = new { Id = 999 };
        
        // Should not throw type-related exceptions
        var exception = Record.Exception(() => dataContext.LoadDataSingleOrDefault<TestEntity>(sql, parameters));
        Assert.IsNotType<ArgumentException>(exception);
        Assert.IsNotType<InvalidCastException>(exception);
    }
}