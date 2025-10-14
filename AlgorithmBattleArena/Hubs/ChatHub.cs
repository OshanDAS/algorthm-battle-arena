using AlgorithmBattleArina.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using AlgorithmBattleArina.Helpers;

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
            if (!int.TryParse(conversationId, out int convId))
                throw new HubException("Invalid conversation ID");

            var userEmail = GetUserEmail();
            if (string.IsNullOrEmpty(userEmail))
                throw new HubException("User not authenticated");

            if (!await _chatRepository.IsParticipantAsync(convId, userEmail))
                throw new HubException("Not authorized to join this conversation");

            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        }

        public async Task LeaveConversation(string conversationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
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
                var messageId = await _chatRepository.SendMessageAsync(convId, userEmail, content);
                
                // Get the full message details for broadcasting
                var messages = await _chatRepository.GetMessagesAsync(convId, 1, 0);
                var message = messages.FirstOrDefault();
                
                if (message != null)
                {
                    await Clients.Group($"conversation_{conversationId}")
                        .SendAsync("NewMessage", message);
                }
            }
            catch (Exception ex)
            {
                throw new HubException($"Failed to send message: {ex.Message}");
            }
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            return base.OnDisconnectedAsync(exception);
        }
    }
}