export default function handler(req: any, res: any) {
  console.log('🧪 === TEST API FUNCTION START ===');
  
  try {
    res.setHeader('Content-Type', 'application/json');
    
    const response = {
      success: true,
      message: 'Test API is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    };
    
    console.log('✅ Test API sending response:', response);
    res.status(200).json(response);
    
    console.log('✅ === TEST API FUNCTION SUCCESS ===');
  } catch (error) {
    console.error('❌ === TEST API FUNCTION ERROR ===');
    console.error('❌ Error:', error);
    
    res.status(500).json({ 
      error: 'Test API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
