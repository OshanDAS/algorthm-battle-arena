using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Moq;
using System.Security.Claims;
using AlgorithmBattleArena.Controllers;
using AlgorithmBattleArena.Repositories;
using AlgorithmBattleArena.Helpers;
using AlgorithmBattleArena.Dtos;
using AlgorithmBattleArena.Hubs;

namespace AlgorithmBattleArena.Tests
{
    public class ChatControllerTests
    {
        private readonly Mock<IChatRepository> _mockChatRepository;
        private readonly Mock<IFriendsRepository> _mockFriendsRepository;
        private readonly Mock<AuthHelper> _mockAuthHelper;
        private readonly Mock<IHubContext<ChatHub>> _mockHubContext;
        private readonly ChatController _controller;

        public ChatControllerTests()
        {
            _mockChatRepository = new Mock<IChatRepository>();
            _mockFriendsRepository = new Mock<IFriendsRepository>();
            _mockAuthHelper = new Mock<AuthHelper>();
            _mockHubContext = new Mock<IHubContext<ChatHub>>();

            _controller = new ChatController(
                _mockChatRepository.Object,
                _mockFriendsRepository.Object,
                _mockAuthHelper.Object,
                _mockHubContext.Object
            );

            // Setup controller context
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Email, "test@example.com")
            }));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task GetConversations_WithValidUser_ReturnsOk()
        {
            // Arrange
            var userEmail = "test@example.com";
            var conversations = new List<ConversationDto>
            {
                new ConversationDto { ConversationId = 1, Type = "Friend" }
            };

            _mockAuthHelper.Setup(x => x.GetEmailFromClaims(It.IsAny<ClaimsPrincipal>()))
                          .Returns(userEmail);
            _mockChatRepository.Setup(x => x.GetConversationsAsync(userEmail))
                              .ReturnsAsync(conversations);

            // Act
            var result = await _controller.GetConversations();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(conversations, okResult.Value);
        }

        [Fact]
        public async Task SendMessage_WithValidData_ReturnsOk()
        {
            // Arrange
            var userEmail = "test@example.com";
            var conversationId = 1;
            var messageContent = "Hello, World!";
            var messageId = 123;

            var request = new SendMessageDto { Content = messageContent };

            _mockAuthHelper.Setup(x => x.GetEmailFromClaims(It.IsAny<ClaimsPrincipal>()))
                          .Returns(userEmail);
            _mockChatRepository.Setup(x => x.IsParticipantAsync(conversationId, userEmail))
                              .ReturnsAsync(true);
            _mockChatRepository.Setup(x => x.SendMessageAsync(conversationId, userEmail, messageContent))
                              .ReturnsAsync(messageId);

            // Act
            var result = await _controller.SendMessage(conversationId, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task SendMessage_WithEmptyContent_ReturnsBadRequest()
        {
            // Arrange
            var userEmail = "test@example.com";
            var conversationId = 1;
            var request = new SendMessageDto { Content = "" };

            _mockAuthHelper.Setup(x => x.GetEmailFromClaims(It.IsAny<ClaimsPrincipal>()))
                          .Returns(userEmail);

            // Act
            var result = await _controller.SendMessage(conversationId, request);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task SendMessage_WithUnauthorizedUser_ReturnsForbid()
        {
            // Arrange
            var userEmail = "test@example.com";
            var conversationId = 1;
            var request = new SendMessageDto { Content = "Hello" };

            _mockAuthHelper.Setup(x => x.GetEmailFromClaims(It.IsAny<ClaimsPrincipal>()))
                          .Returns(userEmail);
            _mockChatRepository.Setup(x => x.IsParticipantAsync(conversationId, userEmail))
                              .ReturnsAsync(false);

            // Act
            var result = await _controller.SendMessage(conversationId, request);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }
    }
}