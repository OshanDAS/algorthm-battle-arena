using AlgorithmBattleArina.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using AlgorithmBattleArina.Helpers;
using AlgorithmBattleArina.Dtos;

namespace AlgorithmBattleArina.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatRepository _chatRepository;
        private readonly AuthHelper _authHelper;

        public ChatHub(IChatRepository chatRepository, AuthHelper authHelper)
        {
            _chatRepository = chatRepository;
            _authHelper = authHelper;
        }

        private string? GetUserEmail()
        {
            if (Context.User == null) return null;
            return _authHelper.GetEmailFromClaims(Context.User);
        }

        public async Task JoinConversation(string conversationId)
        {
            try
            {
                if (!int.TryParse(conversationId, out int convId))
                    throw new HubException("Invalid conversation ID");

                var userEmail = GetUserEmail();
                if (string.IsNullOrEmpty(userEmail))
                    throw new HubException("User not authenticated");

                if (!await _chatRepository.IsParticipantAsync(convId, userEmail))
                    throw new HubException("Not authorized to join this conversation");

                await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
            }
            catch (Exception ex) when (!(ex is HubException))
            {
                throw new HubException($"Failed to join conversation: {ex.Message}");
            }
        }

        public async Task LeaveConversation(string conversationId)
        {
            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
            }
            catch (Exception ex)
            {
                throw new HubException($"Failed to leave conversation: {ex.Message}");
            }
        }

        public async Task SendMessage(string conversationId, string content)
        {
            if (!int.TryParse(conversationId, out int convId))
                throw new HubException("Invalid conversation ID");

            var userEmail = GetUserEmail();
            if (string.IsNullOrEmpty(userEmail))
                throw new HubException("User not authenticated");

            if (!await _chatRepository.IsParticipantAsync(convId, userEmail))
                throw new HubException("Not authorized to send messages in this conversation");

            try
            {
                if (string.IsNullOrWhiteSpace(content))
                    throw new HubException("Message content cannot be empty");

                var messageId = await _chatRepository.SendMessageAsync(convId, userEmail, content.Trim());
                
                // Get sender name for better display
                var senderName = GetSenderDisplayName(userEmail);
                
                // Create message object for broadcasting without additional DB query
                var message = new MessageDto
                {
                    MessageId = messageId,
                    ConversationId = convId,
                    SenderEmail = userEmail,
                    SenderName = senderName,
                    Content = content.Trim(),
                    SentAt = DateTime.UtcNow
                };
                
                await Clients.Group($"conversation_{conversationId}")
                    .SendAsync("NewMessage", message);
            }
            catch (Exception ex)
            {
                throw new HubException($"Failed to send message: {ex.Message}");
            }
        }

        private string GetSenderDisplayName(string email)
        {
            try
            {
                // For now, just return the email part before @ as display name
                // This can be enhanced later with proper database queries
                var atIndex = email.IndexOf('@');
                if (atIndex > 0)
                {
                    return email.Substring(0, atIndex);
                }
                return email;
            }
            catch
            {
                return email; // Fallback to email if anything fails
            }
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            return base.OnDisconnectedAsync(exception);
        }
    }
}