import * as signalR from '@microsoft/signalr';
import apiService from './api';
import { getToken } from './tokenStorage';

class SignalRService {
    constructor() {
        this.connection = null;
        this.connectionState = 'disconnected';
        this.callbacks = {
            LobbyUpdated: [],
            MatchStarted: [],
            LobbyDeleted: [],
        };
    }

    start() {
        if (this.connectionState !== 'disconnected') {
            return;
        }

        const token = getToken();
        if (!token) {
            console.log("No token, SignalR connection not started.");
            return;
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiService.client.defaults.baseURL}/lobbyHub`, {
                accessTokenFactory: () => getToken(),
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.connection.onclose(err => {
            console.log('SignalR disconnected.', err);
            this.connectionState = 'disconnected';
        });

        this.connection.on('LobbyUpdated', (lobby) => {
            this.callbacks.LobbyUpdated.forEach(callback => callback(lobby));
        });

        this.connection.on('MatchStarted', (match) => {
            this.callbacks.MatchStarted.forEach(callback => callback(match));
        });

        this.connection.on('LobbyDeleted', () => {
            this.callbacks.LobbyDeleted.forEach(callback => callback());
        });

        this.connection.start()
            .then(() => {
                console.log('SignalR connected successfully.');
                this.connectionState = 'connected';
            })
            .catch(err => {
                console.error('SignalR connection failed: ', err);
                this.connectionState = 'disconnected';
            });
    }

    stop() {
        if (this.connection && this.connectionState === 'connected') {
            this.connection.stop();
        }
    }

    joinLobby(lobbyId) {
        if (this.connection && this.connectionState === 'connected') {
            this.connection.invoke('JoinLobby', lobbyId).catch(err => console.error(err));
        }
    }

    leaveLobby(lobbyId) {
        if (this.connection && this.connectionState === 'connected') {
            this.connection.invoke('LeaveLobby', lobbyId).catch(err => console.error(err));
        }
    }

    onLobbyUpdated(callback) {
        this.callbacks.LobbyUpdated.push(callback);
        return () => {
            this.callbacks.LobbyUpdated = this.callbacks.LobbyUpdated.filter(cb => cb !== callback);
        };
    }

    onMatchStarted(callback) {
        this.callbacks.MatchStarted.push(callback);
        return () => {
            this.callbacks.MatchStarted = this.callbacks.MatchStarted.filter(cb => cb !== callback);
        };
    }

    onLobbyDeleted(callback) {
        this.callbacks.LobbyDeleted.push(callback);
        return () => {
            this.callbacks.LobbyDeleted = this.callbacks.LobbyDeleted.filter(cb => cb !== callback);
        };
    }
}

const signalRService = new SignalRService();
export default signalRService;
