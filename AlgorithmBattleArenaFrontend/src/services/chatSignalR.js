import * as signalR from '@microsoft/signalr';
import apiService from './api';
import { getToken } from './tokenStorage';

class ChatSignalRService {
  constructor() {
    this.connection = null;
    this.connectionState = 'disconnected';
    this.callbacks = {
      ReceiveMessage: []
    };
  }

  async start() {
    if (this.connectionState !== 'disconnected') return;

    const token = getToken();
    if (!token) return Promise.reject('No token');

    this.connectionState = 'connecting';
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiService.client.defaults.baseURL}/chathub`, {
        accessTokenFactory: () => getToken(),
      })
      .withAutomaticReconnect()
      .build();

    this.connection.onclose(() => {
      this.connectionState = 'disconnected';
    });

    this.connection.on('NewMessage', (message) => {
      this.callbacks.ReceiveMessage.forEach(callback => callback(message));
    });

    try {
      await this.connection.start();
      this.connectionState = 'connected';
    } catch (err) {
      this.connectionState = 'disconnected';
      throw err;
    }
  }

  async joinConversation(conversationId) {
    if (this.connectionState === 'disconnected') await this.start();
    if (this.connection && this.connectionState === 'connected') {
      await this.connection.invoke('JoinConversation', conversationId.toString());
    }
  }

  async leaveConversation(conversationId) {
    if (this.connection && this.connectionState === 'connected') {
      await this.connection.invoke('LeaveConversation', conversationId.toString());
    }
  }

  async sendMessage(conversationId, content) {
    if (this.connection && this.connectionState === 'connected') {
      await this.connection.invoke('SendMessage', conversationId.toString(), content);
    }
  }

  onReceiveMessage(callback) {
    this.callbacks.ReceiveMessage.push(callback);
    return () => {
      this.callbacks.ReceiveMessage = this.callbacks.ReceiveMessage.filter(cb => cb !== callback);
    };
  }

  stop() {
    if (this.connection && this.connectionState === 'connected') {
      this.connection.stop();
    }
  }
}

export default new ChatSignalRService();