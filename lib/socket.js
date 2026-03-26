"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
var socket_io_1 = require("socket.io");
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function initSocket(server) {
    var _this = this;
    var io = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // En production, spécifier les domaines autorisés
            methods: ['GET', 'POST'],
        },
    });
    io.on('connection', function (socket) {
        console.log('Client connected:', socket.id);
        // Join a specific chat room
        socket.on('join_room', function (roomId) {
            socket.join(roomId);
            console.log("Socket ".concat(socket.id, " joined room ").concat(roomId));
        });
        // Leave a specific chat room
        socket.on('leave_room', function (roomId) {
            socket.leave(roomId);
            console.log("Socket ".concat(socket.id, " left room ").concat(roomId));
        });
        // Handle new messages
        socket.on('send_message', function (data) { return __awaiter(_this, void 0, void 0, function () {
            var savedMessage, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Broadcast the message immediately to others in the room
                        socket.to(data.roomId).emit('new_message', {
                            senderId: data.senderId,
                            content: data.content,
                            roomId: data.roomId,
                            sentAt: new Date(),
                            tempId: Date.now() // to help client sorting
                        });
                        return [4 /*yield*/, prisma.message.create({
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
                            })];
                    case 1:
                        savedMessage = _a.sent();
                        // Notify room that message is confirmed
                        io.to(data.roomId).emit('message_confirmed', savedMessage);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.error('Error saving message:', err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // Mark as read (ticks bleus)
        socket.on('mark_as_read', function (data) { return __awaiter(_this, void 0, void 0, function () {
            var err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.message.update({
                                where: { id: data.messageId },
                                data: {
                                    readBy: {
                                        connect: { id: data.userId }
                                    }
                                }
                            })];
                    case 1:
                        _a.sent();
                        // Notify others in the room that this user read this message
                        socket.to(data.roomId).emit('message_read', {
                            messageId: data.messageId,
                            userId: data.userId
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _a.sent();
                        console.error('Error marking message as read:', err_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // --- WebRTC Signaling Events ---
        socket.on('webrtc_offer', function (data) {
            // Forward offer
            socket.to(data.roomId).emit('webrtc_offer', {
                callerId: data.callerId,
                sdp: data.sdp
            });
        });
        socket.on('webrtc_answer', function (data) {
            // Forward answer
            socket.to(data.roomId).emit('webrtc_answer', {
                responderId: data.responderId,
                sdp: data.sdp
            });
        });
        socket.on('webrtc_ice_candidate', function (data) {
            // Forward ICE Candidate
            socket.to(data.roomId).emit('webrtc_ice_candidate', {
                candidate: data.candidate
            });
        });
        socket.on('disconnect', function () {
            console.log('Client disconnected:', socket.id);
        });
    });
    return io;
}
