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
}
