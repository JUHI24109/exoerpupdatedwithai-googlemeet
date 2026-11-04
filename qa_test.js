const axios = require('axios');

async function runTests() {
    try {
        console.log('--- STARTING QA AUTOMATED TESTS ---');
        
        // 1. Login
        console.log('1. Testing Login (admin)...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@exo.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('✅ Login Successful');

        // 2. Profile Update
        console.log('2. Testing Profile Update (with empty date)...');
        const profileRes = await axios.put('http://localhost:5000/api/auth/profile', {
            fullName: 'Admin User',
            dob: '',
            calendarProvider: 'Other'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Profile Update Successful:', profileRes.data.message);

        // 3. Create Ticket
        console.log('3. Testing Ticket Creation...');
        const ticketRes = await axios.post('http://localhost:5000/api/tickets', {
            title: 'QA Automated Test Ticket',
            description: 'Testing if tickets work properly',
            priority: 'High',
            assigneeId: loginRes.data.user.id
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Ticket Created Successfully, ID:', ticketRes.data.ticketId);
        
        console.log('--- ALL QA TESTS PASSED ---');
    } catch (err) {
        console.error('❌ QA Test Failed:', err.response ? err.response.data : err.message);
    }
}

runTests();
