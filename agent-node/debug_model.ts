
import { getModel } from '@mariozechner/pi-ai';

try {
    const model = getModel('google', 'gemini-2.0-flash-001' as any);
    console.log('Model object:', JSON.stringify(model, null, 2));
} catch (e) {
    console.error('Error getting model:', e);
}

try {
    const model2 = getModel('google', 'gemini-2.0-flash');
    console.log('Model 2.0-flash object:', JSON.stringify(model2, null, 2));
} catch (e) {
    console.error('Error getting model 2.0-flash:', e);
}
