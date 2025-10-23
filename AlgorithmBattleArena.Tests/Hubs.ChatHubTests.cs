using Microsoft.AspNetCore.SignalR;
using Moq;
using System.Security.Claims;
using AlgorithmBattleArena.Hubs;
using AlgorithmBattleArena.Repositories;
using AlgorithmBattleArena.Helpers;

namespace AlgorithmBattleArena.Tests
{
    public class ChatHubTests
    {
        private readonly Mock<IChatRepository> _mockChatRepository;
        private readonly Mock<AuthHelper> _mockAuthHelper;
        private readonly Mock<HubCallerContext> _mockContext;
        private readonly Mock<IGroupManager> _mockGroups;
        private readonly Mock<IHubCallerClients> _mockClients;
        private readonly ChatHub _hub;

        public ChatHubTests()
        {
            _mockChatRepository = new Mock<IChatRepository>();
            _mockAuthHelper = new Mock<AuthHelper>();
            _mockContext = new Mock<HubCallerContext>();
            _mockGroups = new Mock<IGroupManager>();
            _mockClients = new Mock<IHubCallerClients>();

            _hub = new ChatHub(_mockChatRepository.Object, _mockAuthHelper.Object);

            // Setup hub context
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Email, "test@example.com")
            }));

            _mockContext.Setup(x => x.User).Returns(user);
            _mockContext.Setup(x => x.ConnectionId).Returns("test-connection-id");

            _hub.Context = _mockContext.Object;
            _hub.Groups = _mockGroups.Object;
            _hub.Clients = _mockClients.Object;
        }

        [Fact]
        public async Task JoinConversation_WithValidData_JoinsGroup()
        {
            // Arrange
            var conversationId = "1";
            var userEmail = "test@example.com";

            _mockAuthHelper.Setup(x => x.GetEmailFromClaims(It.IsAny<ClaimsPrincipal>()))
                          .Returns(userEmail);
            _mockChatRepository.Setup(x => x.IsParticipantAsync(1, userEmail))
                              .ReturnsAsync(true);

            // Act
            await _hub.JoinConversation(conversationId);

            // Assert
            _mockGroups.Verify(x => x.AddToGroupAsync("test-connection-id", "conversation_1", default), Times.Once);
        }

        [Fact]
        public async Task JoinConversation_WithInvalidId_ThrowsHubException()
        {
            // Arrange
            var conversationId = "invalid";

            // Act & Assert
            await Assert.ThrowsAsync<HubException>(() => _hub.JoinConversation(conversationId));
        }

        [Fact]
        public async Task JoinConversation_WithUnauthorizedUser_ThrowsHubException()
        {
            // Arrange
            var conversationId = "1";
            var userEmail = "test@example.com";

            _mockAuthHelper.Setup(x => x.GetEmailFromClaims(It.IsAny<ClaimsPrincipal>()))
                          .Returns(userEmail);
            _mockChatRepository.Setup(x => x.IsParticipantAsync(1, userEmail))
                              .ReturnsAsync(false);

            // Act & Assert
            await Assert.ThrowsAsync<HubException>(() => _hub.JoinConversation(conversationId));
        }

        [Fact]
        public async Task SendMessage_WithEmptyContent_ThrowsHubException()
        {
            // Arrange
            var conversationId = "1";
            var content = "";

            // Act & Assert
            await Assert.ThrowsAsync<HubException>(() => _hub.SendMessage(conversationId, content));
        }

        [Fact]
        public async Task LeaveConversation_WithValidId_LeavesGroup()
        {
            // Arrange
            var conversationId = "1";

            // Act
            await _hub.LeaveConversation(conversationId);

            // Assert
            _mockGroups.Verify(x => x.RemoveFromGroupAsync("test-connection-id", "conversation_1", default), Times.Once);
        }
    }
}