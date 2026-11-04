const Notification = require('../models/Notification');

/**
 * Sends a notification to a specific user via Database and Socket.io
 * Uses Socket.io rooms to send ONLY to the target user (not broadcast)
 */
const notifyUser = async (app, userId, data) => {
    try {
        const { title, message, type, relatedId } = data;

        // 1. Create DB Record
        const notif = await Notification.create({
            userId,
            title,
            message,
            type,
            relatedId,
            isRead: false
        });

        // 2. Emit Socket Event to ONLY the target user's room (no broadcast)
        const io = app.get('io');
        if (io) {
            io.to(String(userId)).emit('new_notification', notif);
        }

        return notif;
    } catch (err) {
        console.error('Notification Error:', err);
    }
};

module.exports = { notifyUser };
