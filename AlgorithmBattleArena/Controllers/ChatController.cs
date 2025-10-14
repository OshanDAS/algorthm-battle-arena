using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AlgorithmBattleArina.Repositories;
using AlgorithmBattleArina.Dtos;
using AlgorithmBattleArina.Helpers;
using AlgorithmBattleArina.Attributes;
using Microsoft.AspNetCore.SignalR;
using AlgorithmBattleArina.Hubs;

namespace AlgorithmBattleArina.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _chatRepository;
        private readonly IFriendsRepository _friendsRepository;
        private readonly AuthHelper _authHelper;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(IChatRepository chatRepository, IFriendsRepository friendsRepository, 
            AuthHelper authHelper, IHubContext<ChatHub> hubContext)
        {
            _chatRepository = chatRepository;
            _friendsRepository = friendsRepository;
            _authHelper = authHelper;
            _hubContext = hubContext;
        }

        [HttpGet("conversations")]
        public async Task<ActionResult<IEnumerable<ConversationDto>>> GetConversations()
        {
            try
            {
                var userEmail = _authHelper.GetEmailFromClaims(User);
                if (string.IsNullOrEmpty(userEmail)) return Unauthorized();

                var conversations = await _chatRepository.GetConversationsAsync(userEmail);
                return Ok(conversations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error getting conversations: {ex.Message}");
            }
        }



        [HttpGet("conversations/{conversationId:int}/messages")]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessages(int conversationId, 
            [FromQuery] int pageSize = 50, [FromQuery] int offset = 0)
        {
            try
            {
                var userEmail = _authHelper.GetEmailFromClaims(User);
                if (string.IsNullOrEmpty(userEmail)) return Unauthorized();

                if (!await _chatRepository.IsParticipantAsync(conversationId, userEmail))
                    return Forbid("Not a participant in this conversation");

                var messages = await _chatRepository.GetMessagesAsync(conversationId, pageSize, offset);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error getting messages: {ex.Message}");
            }
        }

        [HttpPost("conversations/{conversationId:int}/messages")]
        public async Task<ActionResult> SendMessage(int conversationId, [FromBody] SendMessageDto request)
        {
            try
            {
                var userEmail = _authHelper.GetEmailFromClaims(User);
                if (string.IsNullOrEmpty(userEmail)) return Unauthorized();

                if (string.IsNullOrWhiteSpace(request?.Content))
                    return BadRequest("Message content cannot be empty");

                if (!await _chatRepository.IsParticipantAsync(conversationId, userEmail))
                    return Forbid("Not a participant in this conversation");

                var messageId = await _chatRepository.SendMessageAsync(conversationId, userEmail, request.Content.Trim());
                
                // Create message object for broadcasting without additional DB query
                var senderName = GetSenderDisplayName(userEmail);
                var message = new MessageDto
                {
                    MessageId = messageId,
                    ConversationId = conversationId,
                    SenderEmail = userEmail,
                    SenderName = senderName,
                    Content = request.Content.Trim(),
                    SentAt = DateTime.UtcNow
                };
                
                if (message != null)
                {
                    await _hubContext.Clients.Group($"conversation_{conversationId}")
                        .SendAsync("NewMessage", message);
                }

                return Ok(new { MessageId = messageId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to send message: {ex.Message}");
            }
        }

        [HttpPost("conversations/friend")]
        [StudentOnly]
        public async Task<ActionResult> CreateFriendConversation([FromBody] CreateFriendConversationDto request)
        {
            try
            {
                var userEmail = _authHelper.GetEmailFromClaims(User);
                var userId = _authHelper.GetUserIdFromClaims(User, "Student");
                if (string.IsNullOrEmpty(userEmail) || userId == null) return Unauthorized();

                if (request == null || string.IsNullOrWhiteSpace(request.FriendEmail))
                    return BadRequest("Invalid friend information");

                // Check if users are friends
                var friends = await _friendsRepository.GetFriendsAsync(userId.Value);
                if (!friends.Any(f => f.StudentId == request.FriendId))
                    return BadRequest("You can only chat with friends");

                // Check if conversation already exists
                var existingConversation = await _chatRepository.GetFriendConversationAsync(userEmail, request.FriendEmail);
                if (existingConversation != null)
                    return Ok(existingConversation);

                // Create new conversation
                var participantEmails = new List<string> { userEmail, request.FriendEmail };
                var conversationId = await _chatRepository.CreateConversationAsync("Friend", null, participantEmails);
                
                var conversation = await _chatRepository.GetConversationAsync(conversationId);
                return Ok(conversation);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to create conversation: {ex.Message}");
            }
        }

        private string GetSenderDisplayName(string email)
        {
            try
            {
                var atIndex = email.IndexOf('@');
                if (atIndex > 0)
                {
                    return email.Substring(0, atIndex);
                }
                return email;
            }
            catch
            {
                return email;
            }
        }
    }
}