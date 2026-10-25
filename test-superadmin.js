// test-superadmin.js
const axios = require('axios');

async function testSuperAdmin() {
  try {
    console.log('🔑 1. Logging in as Super Admin...');
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      phone_number: '0700000000',
      password: 'Password123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login Successful! Token acquired.\n');
    
    const headers = { Authorization: `Bearer ${token}` };

    console.log('📡 2. Fetching All Schools...');
    const schoolsRes = await axios.get('http://localhost:5000/api/v1/superadmin/schools', { headers });
    console.log('✅ Schools Response:', JSON.stringify(schoolsRes.data, null, 2));

    console.log('\n📡 3. Fetching Default School Subscriptions...');
    const subsRes = await axios.get('http://localhost:5000/api/v1/superadmin/schools/00000000-0000-0000-0000-000000000001/subscriptions', { headers });
    console.log('✅ Subscriptions Response:', JSON.stringify(subsRes.data, null, 2));

    console.log('\n🎉 ALL TESTS PASSED! Your Super Admin backend is fully operational.');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
      console.log('💡 Tip: Make sure your backend server is running (node src/server.js)');
    }
  }
}

testSuperAdmin();
