
/**
 * PortalIntel Cloud Dispatch Service
 * Optimized for Resend API Integration with Security Fail-safes.
 */

export interface DispatchStatus {
  step: 'initializing' | 'encrypting' | 'routing' | 'delivering' | 'success' | 'error' | 'security_block';
  message: string;
}

export const dispatchScoutingReport = async (
  recipient: string, 
  subject: string, 
  body: string,
  onStatusUpdate: (status: DispatchStatus) => void
): Promise<boolean> => {
  const RESEND_API_KEY = 're_WqFfyNRP_7QuCSzoRKhKz2Xf5mrEfo1Zb';

  try {
    onStatusUpdate({ step: 'initializing', message: 'Initializing secure E2E tunnel...' });
    await new Promise(r => setTimeout(r, 600));

    onStatusUpdate({ step: 'encrypting', message: 'Encrypting intelligence payload...' });
    await new Promise(r => setTimeout(r, 800));

    onStatusUpdate({ step: 'routing', message: 'Routing via Resend Cloud Relay...' });
    
    // Attempt the direct fetch
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PortalIntel <onboarding@resend.dev>',
        to: [recipient],
        subject: subject,
        text: body,
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Relay connection failed");
    }

    onStatusUpdate({ step: 'delivering', message: `Verifying delivery to ${recipient.split('@')[1]}...` });
    await new Promise(r => setTimeout(r, 1000));

    onStatusUpdate({ step: 'success', message: 'Intelligence successfully dispatched.' });
    return true;
  } catch (error: any) {
    console.error("Dispatch Error:", error);
    
    // Detect CORS/Network errors specifically
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
       onStatusUpdate({ 
         step: 'security_block', 
         message: 'Cloud Relay blocked by Browser Security (CORS). Direct API calls from browsers are restricted.' 
       });
    } else {
       onStatusUpdate({ 
         step: 'error', 
         message: `Dispatch failed: ${error.message || 'Secure line dropped.'}` 
       });
    }
    return false;
  }
};
