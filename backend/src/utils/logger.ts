import fs from 'fs';
import path from 'path';

export const logDetailedError = (context: string, error: any) => {
  const logPath = path.resolve(__dirname, '../../detailed_errors.log');
  const timestamp = new Date().toISOString();
  const logMessage = `
[${timestamp}] --- ${context} ---
Message: ${error.message}
Stack: ${error.stack}
Details: ${JSON.stringify(error, null, 2)}
--------------------------------------------------
`;

  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (err) {
    console.error('Failed to write to detailed_errors.log', err);
  }
};
