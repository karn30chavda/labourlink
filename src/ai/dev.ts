import { config } from 'dotenv';
config();

import '@/ai/flows/labor-match.ts';
import '@/ai/flows/relevant-job-notifications.ts';
import '@/ai/flows/job-description-generator.ts';