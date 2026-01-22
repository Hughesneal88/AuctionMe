import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Bid } from '../models/Bid';
import { Notification } from '../models/Notification';

export class WebSocketService {
  private io: SocketIOServer | null = null;

  /**
   * Initialize Socket.IO server
   */
  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*', // In production, specify allowed origins
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join auction room
      socket.on('join-auction', (auctionId: string) => {
        socket.join(`auction:${auctionId}`);
        console.log(`Socket ${socket.id} joined auction:${auctionId}`);
      });

      // Leave auction room
      socket.on('leave-auction', (auctionId: string) => {
        socket.leave(`auction:${auctionId}`);
        console.log(`Socket ${socket.id} left auction:${auctionId}`);
      });

      // Join user room for personal notifications
      socket.on('join-user', (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined user:${userId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Broadcast new bid to all clients watching an auction
   */
  broadcastNewBid(auctionId: string, bid: Bid): void {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.to(`auction:${auctionId}`).emit('new-bid', {
      auctionId,
      bid,
      timestamp: new Date(),
    });
  }

  /**
   * Send notification to a specific user
   */
  sendNotificationToUser(userId: string, notification: Notification): void {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Broadcast auction closed event
   */
  broadcastAuctionClosed(auctionId: string, winnerId?: string, winningBid?: number): void {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.to(`auction:${auctionId}`).emit('auction-closed', {
      auctionId,
      winnerId,
      winningBid,
      timestamp: new Date(),
    });
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const wsService = new WebSocketService();
