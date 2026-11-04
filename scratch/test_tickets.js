const sequelize = require('./backend/config/db');
const Ticket = require('./backend/models/Ticket');
const User = require('./backend/models/User');

(async () => {
    try {
        await sequelize.authenticate();
        const tickets = await Ticket.findAll({ include: [{ model: User, as: 'Creator', attributes: ['fullName', 'id', 'employeeId'] }] });
        console.log("=== TICKETS DUMP ===");
        tickets.forEach(t => {
            console.log(`- ${t.ticketId}: "${t.title}" | Status: ${t.status} | CreatorId: ${t.creatorId} (Name: ${t.Creator ? t.Creator.fullName : 'None'}, EmpId: ${t.Creator ? t.Creator.employeeId : 'None'})`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
