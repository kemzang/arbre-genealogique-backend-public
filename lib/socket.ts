import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function initSocket(server: NetServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*', // En production, spécifier les domaines autorisés
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a specific chat room
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Leave a specific chat room
    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room ${roomId}`);
    });

    // Handle new messages
    socket.on('send_message', async (data: { roomId: string; senderId: string; content: string }) => {
      try {
        // Broadcast the message immediately to others in the room
        socket.to(data.roomId).emit('new_message', {
          senderId: data.senderId,
          content: data.content,
          roomId: data.roomId,
          sentAt: new Date(),
          tempId: Date.now() // to help client sorting
        });

        // Save to DB asynchronously
        const savedMessage = await prisma.message.create({
          data: {
            chatRoomId: data.roomId,
            senderId: data.senderId,
            content: data.content,
          },
          include: {
            sender: {
              select: { id: true, displayName: true, profilePictureUrl: true }
            }
          }
        });

        // Notify room that message is confirmed
        io.to(data.roomId).emit('message_confirmed', savedMessage);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    // Mark as read (ticks bleus)
    socket.on('mark_as_read', async (data: { messageId: string; userId: string; roomId: string }) => {
      try {
        await prisma.message.update({
          where: { id: data.messageId },
          data: {
            readBy: {
              connect: { id: data.userId }
            }
          }
        });
        
        // Notify others in the room that this user read this message
        socket.to(data.roomId).emit('message_read', {
          messageId: data.messageId,
          userId: data.userId
        });
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    });

    // --- WebRTC Signaling Events ---

    socket.on('webrtc_offer', (data: { targetUserId: string; callerId: string; roomId: string; sdp: any }) => {
      // Forward offer
      socket.to(data.roomId).emit('webrtc_offer', {
        callerId: data.callerId,
        sdp: data.sdp
      });
    });

    socket.on('webrtc_answer', (data: { targetUserId: string; responderId: string; roomId: string; sdp: any }) => {
      // Forward answer
      socket.to(data.roomId).emit('webrtc_answer', {
        responderId: data.responderId,
        sdp: data.sdp
      });
    });

    socket.on('webrtc_ice_candidate', (data: { targetUserId: string; candidate: any; roomId: string }) => {
      // Forward ICE Candidate
      socket.to(data.roomId).emit('webrtc_ice_candidate', {
        candidate: data.candidate
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
