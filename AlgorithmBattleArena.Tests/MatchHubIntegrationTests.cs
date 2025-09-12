using AlgorithmBattleArena;
using AlgorithmBattleArena.Helpers;
using AlgorithmBattleArena.Hubs;
using AlgorithmBattleArena.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration; // for IConfiguration
using System;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Net.Http.Json;               // for PostAsJsonAsync
using System.Threading.Tasks;
using Xunit;

using AlgorithmBattleArena.Services;
using Microsoft.Extensions.DependencyInjection;


namespace AlgorithmBattleArena.Tests
{
    public class MatchHubIntegrationTests
        : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly DevTokenService _tokenService;

        public MatchHubIntegrationTests(WebApplicationFactory<Program> factory)
        {
            // Spin up the in-memory test server and inject test config
            _factory = factory.WithWebHostBuilder(builder =>
{
    builder.ConfigureAppConfiguration((ctx, cfg) =>
    {
        cfg.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = "supersecret_test_key_12345678901234567890"
        });
    });
});

            // Pull config with overrides applied
            var config = _factory.Services.GetService(typeof(IConfiguration)) as IConfiguration
                         ?? throw new InvalidOperationException("No IConfiguration in test host");

            _tokenService = new DevTokenService(config);
        }

        [Fact]
        public async Task ClientsInSameLobbyReceiveIdenticalStartAtUtc()
        {
            // Arrange: generate tokens for two players and one host
            var tokenPlayer1 = _tokenService.GenerateToken("player1");
            var tokenPlayer2 = _tokenService.GenerateToken("player2");
            var tokenHost = _tokenService.GenerateToken("host1");

            var baseUrl = _factory.Server.BaseAddress.ToString().TrimEnd('/');
            const string? lobbyId = "test-lobby";

            // Seed the lobby with players using the in-memory service
            using var scope = _factory.Services.CreateScope();
            var lobbyService = scope.ServiceProvider.GetRequiredService<ILobbyService>();

            if (lobbyService is InMemoryLobbyService memLobby)
            {
                // Use the existing outer variable
                // const string lobbyId = "test-lobby"; <-- REMOVE this line

                // Mark host1 as the host
                memLobby.SetHost(lobbyId, "host1");

                // Seed other players
                memLobby.AddConnection(lobbyId, "player1", "test-conn-1");
                memLobby.AddConnection(lobbyId, "player2", "test-conn-2");

                // Add host connection for SignalR
                memLobby.AddConnection(lobbyId, "host1", "test-conn-host");
            }

            else
            {
                throw new InvalidOperationException("Lobby service is not InMemoryLobbyService");
            }



            // Build SignalR connections for two players
            var conn1 = new HubConnectionBuilder()
                .WithUrl($"{baseUrl}/hubs/match", options =>
                {
                    options.AccessTokenProvider = () => Task.FromResult(tokenPlayer1);
                    options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
                })
                .Build();

            var conn2 = new HubConnectionBuilder()
                .WithUrl($"{baseUrl}/hubs/match", options =>
                {
                    options.AccessTokenProvider = () => Task.FromResult(tokenPlayer2);
                    options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
                })
                .Build();

            var tcs1 = new TaskCompletionSource<MatchStartedDto>();
            var tcs2 = new TaskCompletionSource<MatchStartedDto>();

            conn1.On<MatchStartedDto>("MatchStarted", dto => tcs1.TrySetResult(dto));
            conn2.On<MatchStartedDto>("MatchStarted", dto => tcs2.TrySetResult(dto));

            await conn1.StartAsync();
            await conn2.StartAsync();

            await conn1.InvokeAsync("JoinLobby", lobbyId);
            await conn2.InvokeAsync("JoinLobby", lobbyId);

            // Act: host starts the match via API
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", tokenHost);

            var startReq = new StartMatchRequest
            {
                ProblemId = Guid.NewGuid(),
                DurationSec = 90,
                PreparationBufferSec = 2
            };

            var response = await client.PostAsJsonAsync(
                $"/api/matches/{lobbyId}/start", startReq);

            response.EnsureSuccessStatusCode();

            // Assert: both clients got the same StartAtUtc
            var dto1 = await tcs1.Task.WaitAsync(TimeSpan.FromSeconds(10));
            var dto2 = await tcs2.Task.WaitAsync(TimeSpan.FromSeconds(10));

            Assert.Equal(dto1.StartAtUtc, dto2.StartAtUtc);

            await conn1.DisposeAsync();
            await conn2.DisposeAsync();
        }

    }
}
