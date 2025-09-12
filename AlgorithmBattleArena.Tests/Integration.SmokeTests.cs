using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Threading.Tasks;
using System.Net;

namespace AlgorithmBattleArena.Tests;

public class SmokeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public SmokeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Protected_Endpoint_Returns_401_When_Unauthenticated()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/Auth/profile");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_GetProblems_Returns_401_When_Unauthenticated()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/Problems");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_GetProblem_Returns_401_When_Unauthenticated()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/Problems/1");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_UpsertProblem_Returns_401_When_Unauthenticated()
    {
        var client = _factory.CreateClient();
        var content = new StringContent("{}", System.Text.Encoding.UTF8, "application/json");
        var res = await client.PostAsync("/api/Problems/UpsertProblem", content);
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_DeleteProblem_Returns_401_When_Unauthenticated()
    {
        var client = _factory.CreateClient();
        var res = await client.DeleteAsync("/api/Problems/1");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_GetCategories_Returns_401_When_Unauthenticated()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/Problems/categories");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ProblemsController_GetDifficultyLevels_Returns_401_When_Unauthenticated()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/Problems/difficulty-levels");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }
}
