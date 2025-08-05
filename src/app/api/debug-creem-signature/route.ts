import { creemService } from "@/services/creem";
import { respData, respErr } from "@/lib/resp";

export async function GET(req: Request) {
  try {
    // This is a debug endpoint to test signature generation
    // It should only be used in development
    if (process.env.NODE_ENV === 'production') {
      return respErr('Debug endpoint not available in production');
    }

    // Run the signature generation test
    creemService.testSignatureGeneration();

    return respData({
      message: 'Signature generation test completed. Check console logs for results.',
    });
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return respErr('Debug endpoint failed: ' + error.message);
  }
}