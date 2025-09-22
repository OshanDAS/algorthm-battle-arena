using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Threading.Tasks;
using System.Net;
using System.Text;

namespace AlgorithmBattleArena.Tests;

public class SmokeTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly HttpClient _client;

    // Backup old environment values so we can restore them later
    private static readonly string? _oldTokenKey = Environment.GetEnvironmentVariable("TokenKey");
    private static readonly string? _oldPasswordKey = Environment.GetEnvironmentVariable("PasswordKey");
    private static readonly string? _oldDefaultConnection = Environment.GetEnvironmentVariable("DefaultConnection");

    static SmokeTests()
    {
        // ✅ Set environment variables once, before any tests run
        Environment.SetEnvironmentVariable(
            "TokenKey",
            "test-token-key-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#"
        );
        Environment.SetEnvironmentVariable("PasswordKey", "test-password-key");
        Environment.SetEnvironmentVariable("DefaultConnection", "Server=test;Database=test;Integrated Security=true;");
    }

    public SmokeTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Protected_Endpoint_Returns_401_When_Unauthenticated()
    {
        var res = await _client.GetAsync("/api/Auth/profile");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_GetProblems_Returns_401_When_Unauthenticated()
    {
        var res = await _client.GetAsync("/api/Problems");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_GetProblem_Returns_401_When_Unauthenticated()
    {
        var res = await _client.GetAsync("/api/Problems/1");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_UpsertProblem_Returns_401_When_Unauthenticated()
    {
        var content = new StringContent("{}", Encoding.UTF8, "application/json");
        var res = await _client.PostAsync("/api/Problems/UpsertProblem", content);
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_DeleteProblem_Returns_401_When_Unauthenticated()
    {
        var res = await _client.DeleteAsync("/api/Problems/1");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_GetCategories_Returns_401_When_Unauthenticated()
    {
        var res = await _client.GetAsync("/api/Problems/categories");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_GetDifficultyLevels_Returns_401_When_Unauthenticated()
    {
        var res = await _client.GetAsync("/api/Problems/difficulty-levels");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    public void Dispose()
    {
        // ✅ Reset environment variables after tests
        Environment.SetEnvironmentVariable("TokenKey", _oldTokenKey);
        Environment.SetEnvironmentVariable("PasswordKey", _oldPasswordKey);
        Environment.SetEnvironmentVariable("DefaultConnection", _oldDefaultConnection);
    }
}
