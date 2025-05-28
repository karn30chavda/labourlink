'use server';

/**
 * @fileOverview Provides a curated list of relevant job notifications for a labor user.
 *
 * - getRelevantJobNotifications - A function that retrieves relevant job notifications.
 * - RelevantJobNotificationsInput - The input type for the getRelevantJobNotifications function.
 * - RelevantJobNotificationsOutput - The return type for the getRelevantJobNotifications function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RelevantJobNotificationsInputSchema = z.object({
  laborSkills: z.array(z.string()).describe('List of skills possessed by the labor.'),
  laborCity: z.string().describe('City where the labor is located.'),
  jobPostings: z.array(
    z.object({
      title: z.string().describe('Title of the job posting.'),
      description: z.string().describe('Description of the job.'),
      requiredSkill: z.string().describe('Skill required for the job.'),
      location: z.string().describe('Location of the job.'),
    })
  ).describe('List of available job postings.'),
});
export type RelevantJobNotificationsInput = z.infer<typeof RelevantJobNotificationsInputSchema>;

const RelevantJobNotificationsOutputSchema = z.object({
  relevantJobs: z.array(
    z.object({
      title: z.string().describe('Title of the job posting.'),
      description: z.string().describe('Description of the job.'),
      requiredSkill: z.string().describe('Skill required for the job.'),
      location: z.string().describe('Location of the job.'),
      relevanceScore: z.number().describe('A score indicating the relevance of the job for the labor. Higher is more relevant.'),
    })
  ).describe('Curated list of relevant job postings for the labor.'),
});
export type RelevantJobNotificationsOutput = z.infer<typeof RelevantJobNotificationsOutputSchema>;

export async function getRelevantJobNotifications(
  input: RelevantJobNotificationsInput
): Promise<RelevantJobNotificationsOutput> {
  return relevantJobNotificationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'relevantJobNotificationsPrompt',
  input: {schema: RelevantJobNotificationsInputSchema},
  output: {schema: RelevantJobNotificationsOutputSchema},
  prompt: `You are an AI job matching expert. Given a labor's skills and location, and a list of job postings,
you will return a curated list of the most relevant jobs for the labor.

Labor Skills: {{laborSkills}}
Labor Location: {{laborCity}}

Job Postings:
{{#each jobPostings}}
- Title: {{this.title}}, Description: {{this.description}}, Required Skill: {{this.requiredSkill}}, Location: {{this.location}}
{{/each}}

Return a list of the jobs that are most relevant to the labor, along with a relevance score (higher is better).
Consider both skill match and location when determining relevance. Only include jobs located in the labor's city.
`,
});

const relevantJobNotificationsFlow = ai.defineFlow(
  {
    name: 'relevantJobNotificationsFlow',
    inputSchema: RelevantJobNotificationsInputSchema,
    outputSchema: RelevantJobNotificationsOutputSchema,
  },
  async input => {
    // Filter job postings to only include jobs in the labor's city
    const relevantJobs = input.jobPostings.filter(job => job.location === input.laborCity);

    // If no jobs are in the labor's city, return an empty list
    if (relevantJobs.length === 0) {
      return {relevantJobs: []};
    }

    const {
      output,
    } = await prompt({
      ...input,
      jobPostings: relevantJobs,
    });
    return output!;
  }
);
