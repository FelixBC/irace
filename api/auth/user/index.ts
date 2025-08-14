export default function handler(req: any, res: any) {
  console.log('🚀 === API FUNCTION START ===');
  console.log('🚀 Request object keys:', Object.keys(req));
  console.log('🚀 Response object keys:', Object.keys(res));
  
  try {
    // Test 1: Basic logging
    console.log('✅ Test 1: Basic logging completed');
    
    // Test 2: Check if res.json exists
    console.log('✅ Test 2: res.json exists:', typeof res.json);
    
    // Test 3: Check if res.status exists
    console.log('✅ Test 3: res.status exists:', typeof res.status);
    
    // Test 4: Set basic headers
    console.log('✅ Test 4: Setting headers');
    res.setHeader('Content-Type', 'application/json');
    
    // Test 5: Create response object
    console.log('✅ Test 5: Creating response object');
    const response = {
      success: true,
      message: 'API is working!',
      timestamp: new Date().toISOString()
    };
    
    // Test 6: Send response
    console.log('✅ Test 6: Sending response');
    res.status(200).json(response);
    
    console.log('✅ === API FUNCTION SUCCESS ===');
  } catch (error) {
    console.error('❌ === API FUNCTION ERROR ===');
    console.error('❌ Error:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error constructor:', error?.constructor?.name);
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Try to send error response
    try {
      console.log('🔄 Attempting to send error response...');
      res.status(500).json({ 
        error: 'API function error',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      });
      console.log('✅ Error response sent successfully');
    } catch (sendError) {
      console.error('❌ Failed to send error response:', sendError);
      // Last resort - just end the response
      try {
        res.status(500).end();
        console.log('✅ Basic error response sent');
      } catch (endError) {
        console.error('❌ Failed to send basic error response:', endError);
      }
    }
  }
}
