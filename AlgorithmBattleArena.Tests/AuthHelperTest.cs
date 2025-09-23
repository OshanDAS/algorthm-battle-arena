
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Security.Claims;
using AlgorithmBattleArina.Helpers;

namespace AlgorithmBattleArena.Tests;

public class AuthHelperTest : IDisposable
{
    private readonly List<string> _envVarsToCleanup = new();

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

    private IConfiguration CreateMockConfiguration(string passwordKey = "test-password-key", string tokenKey = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#")
    {
        var inMemorySettings = new Dictionary<string, string?> {
            {"AppSettings:PasswordKey", passwordKey},
            {"AppSettings:TokenKey", tokenKey},
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    [Fact]
    public void GetPasswordSalt_ShouldGenerateUniqueSalts()
    {
        var auth = new AuthHelper(CreateMockConfiguration());
        var salt1 = auth.GetPasswordSalt();
        var salt2 = auth.GetPasswordSalt();
        
        Assert.NotEqual(salt1, salt2);
        Assert.Equal(16, salt1.Length);
    }

    [Fact]
    public void GetPasswordHash_WithValidConfig_ShouldGenerateHash()
    {
        // Clear environment variables that could interfere with test
        SetEnvironmentVariable("PASSWORD_KEY", null!);
        
        var auth = new AuthHelper(CreateMockConfiguration());
        var salt = auth.GetPasswordSalt();
        var hash = auth.GetPasswordHash("password123", salt);
        
        Assert.NotNull(hash);
        Assert.Equal(32, hash.Length);
    }

    [Fact]
    public void VerifyPasswordHash_WithMatchingPasswords_ShouldReturnTrue()
    {
        // Clear environment variables that could interfere with test
        SetEnvironmentVariable("PASSWORD_KEY", null!);
        
        var auth = new AuthHelper(CreateMockConfiguration());
        var salt = auth.GetPasswordSalt();
        var hash = auth.GetPasswordHash("password123", salt);
        
        var result = auth.VerifyPasswordHash("password123", hash, salt);
        
        Assert.True(result);
    }

    [Fact]
    public void VerifyPasswordHash_WithNonMatchingPasswords_ShouldReturnFalse()
    {
        // Clear environment variables that could interfere with test
        SetEnvironmentVariable("PASSWORD_KEY", null!);
        
        var auth = new AuthHelper(CreateMockConfiguration());
        var salt = auth.GetPasswordSalt();
        var hash = auth.GetPasswordHash("password123", salt);
        
        var result = auth.VerifyPasswordHash("wrongpassword", hash, salt);
        
        Assert.False(result);
    }

    [Fact]
    public void CreateToken_WithValidInputs_ShouldCreateValidToken()
    {
        SetEnvironmentVariable("TOKEN_KEY", null!);
        
        var auth = new AuthHelper(CreateMockConfiguration());
        var token = auth.CreateToken("test@test.com", "Student", 1);
        
        Assert.NotNull(token);
        var principal = auth.ValidateToken(token);
        Assert.NotNull(principal);
    }

    [Theory]
    [InlineData("Student", "studentId")]
    [InlineData("Teacher", "teacherId")]
    public void CreateToken_WithUserRole_ShouldIncludeCorrectClaims(string role, string expectedClaimType)
    {
        SetEnvironmentVariable("TOKEN_KEY", null!);
        
        var auth = new AuthHelper(CreateMockConfiguration());
        var token = auth.CreateToken("test@test.com", role, 1);
        var principal = auth.ValidateToken(token);
        
        Assert.NotNull(principal);
        Assert.Equal("test@test.com", auth.GetEmailFromClaims(principal));
        Assert.Equal(role, auth.GetRoleFromClaims(principal));
        Assert.Equal("1", principal.FindFirst(expectedClaimType)?.Value);
    }

    [Fact]
    public void ValidateToken_WithInvalidToken_ShouldReturnNull()
    {
        SetEnvironmentVariable("TOKEN_KEY", null!);
        
        var auth = new AuthHelper(CreateMockConfiguration());
        var result = auth.ValidateToken("invalid-token");
        
        Assert.Null(result);
    }

    [Fact]
    public void GetClaimValue_WithExistingClaim_ShouldReturnValue()
    {
        SetEnvironmentVariable("TOKEN_KEY", null!);
        
        var auth = new AuthHelper(CreateMockConfiguration());
        var token = auth.CreateToken("test@test.com", "Student", 1);
        var principal = auth.ValidateToken(token);
        
        var email = auth.GetClaimValue(principal!, "email", ClaimTypes.Email);
        
        Assert.Equal("test@test.com", email);
    }

    [Fact]
    public void GetClaimValue_WithMissingClaim_ShouldReturnNull()
    {
        SetEnvironmentVariable("TOKEN_KEY", null!);
        
        var auth = new AuthHelper(CreateMockConfiguration());
        var token = auth.CreateToken("test@test.com", "Student", 1);
        var principal = auth.ValidateToken(token);
        
        var value = auth.GetClaimValue(principal!, "nonexistent-claim");
        
        Assert.Null(value);
    }

    [Fact]
    public void GetUserIdFromClaims_WithValidStudentRole_ShouldReturnId()
    {
        SetEnvironmentVariable("TOKEN_KEY", null!);
        
        var auth = new AuthHelper(CreateMockConfiguration());
        var token = auth.CreateToken("test@test.com", "Student", 1);
        var principal = auth.ValidateToken(token);
        
        var userId = auth.GetUserIdFromClaims(principal!, "Student");
        
        Assert.Equal(1, userId);
    }

    [Fact]
    public void GetPasswordHash_WithEnvironmentVariable_ShouldUseEnvVar()
    {
        var envPasswordKey = "env-password-key";
        SetEnvironmentVariable("PASSWORD_KEY", envPasswordKey);
        
        // Verify environment variable is actually set
        Assert.Equal(envPasswordKey, Environment.GetEnvironmentVariable("PASSWORD_KEY"));
        
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> {
                ["AppSettings:PasswordKey"] = "config-password-key"
            })
            .Build();
        var auth = new AuthHelper(config);
        var salt = auth.GetPasswordSalt();
        
        var hash = auth.GetPasswordHash("password123", salt);
        
        Assert.NotNull(hash);
        Assert.Equal(32, hash.Length);
    }

    [Fact]
    public void CreateToken_WithEnvironmentVariable_ShouldUseEnvVar()
    {
        var envTokenKey = "env-token-key-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#";
        SetEnvironmentVariable("TOKEN_KEY", envTokenKey);
        
        // Verify environment variable is actually set
        Assert.Equal(envTokenKey, Environment.GetEnvironmentVariable("TOKEN_KEY"));
        
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> {
                ["AppSettings:TokenKey"] = "config-token-key"
            })
            .Build();
        var auth = new AuthHelper(config);
        
        var token = auth.CreateToken("test@test.com", "Student", 1);
        
        Assert.NotNull(token);
        var principal = auth.ValidateToken(token);
        Assert.NotNull(principal);
    }

    [Fact]
    public void ValidateAdminCredentials_WithEnvironmentVariables_ShouldUseEnvVars()
    {
        var envEmail = "env-admin@test.com";
        var envPassword = "env-admin-pass";
        SetEnvironmentVariable("ADMIN_EMAIL", envEmail);
        SetEnvironmentVariable("ADMIN_PASSWORD", envPassword);
        
        // Verify environment variables are actually set
        Assert.Equal(envEmail, Environment.GetEnvironmentVariable("ADMIN_EMAIL"));
        Assert.Equal(envPassword, Environment.GetEnvironmentVariable("ADMIN_PASSWORD"));
        
        var config = new ConfigurationBuilder().Build();
        var auth = new AuthHelper(config);
        
        var result = auth.ValidateAdminCredentials("env-admin@test.com", "env-admin-pass");
        
        Assert.True(result);
    }
}
