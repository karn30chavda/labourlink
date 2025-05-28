
'use server';
/**
 * @fileOverview An AI-powered labor matching agent.
 *
 * - matchLabor - A function that matches labor to a job post.
 * - MatchLaborInput - The input type for the matchLabor function.
 * - MatchLaborOutput - The return type for the matchLabor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchLaborInputSchema = z.object({
  jobPost: z
    .string()
    .describe('The job post description, including title, description, skills required, location, and duration.'),
  availableLabors: z.array(
    z.object({
      name: z.string().describe('The name of the labor.'),
      role: z.string().describe('The role of the labor (Electrician, Mason etc.).'),
      skills: z.array(z.string()).describe('The skills of the labor.'),
      availability: z.boolean().describe('Whether the labor is available or not.'),
      city: z.string().describe('The city the labor is located in.'),
      pastWorkingSites: z.array(z.string()).describe('List of past working sites'),
    })
  ).describe('A list of available labors with their roles, skills, availability, and city.'),
});
export type MatchLaborInput = z.infer<typeof MatchLaborInputSchema>;

const MatchLaborOutputSchema = z.object({
  bestMatch: z.object({
    name: z.string().describe('The name of the best matching labor.'),
    role: z.string().describe('The role of the best matching labor.'),
    skills: z.array(z.string()).describe('The skills of the best matching labor.'),
    availability: z.boolean().describe('Whether the best matching labor is available or not.'),
    city: z.string().describe('The city the best matching labor is located in.'),
    matchReason: z.string().describe('The reason why this labor is the best match for the job.'),
  }).describe('The best matching labor for the job post.'),
});
export type MatchLaborOutput = z.infer<typeof MatchLaborOutputSchema>;

export async function matchLabor(input: MatchLaborInput): Promise<MatchLaborOutput> {
  return matchLaborFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchLaborPrompt',
  input: {schema: MatchLaborInputSchema},
  output: {schema: MatchLaborOutputSchema},
  prompt: `You are an expert in matching labors to job posts based on their skills and availability.

  Given the following job post:
  {{{jobPost}}}

  And the following available labors:
  {{#each availableLabors}}
  - Name: {{this.name}}, Role: {{this.role}}, Skills: {{#each this.skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, Availability: {{this.availability}}, City: {{this.city}}, Past Working Sites: {{#each this.pastWorkingSites}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/each}}

  Determine the best labor match for the job post and explain why they are the best match. Consider the skills required for the job, the labor's skills, their availability, and their location.

  Return the best match in the following format:
  {
    "bestMatch": {
      "name": "Name of the best matching labor",
      "role": "Role of the best matching labor",
      "skills": ["Skill 1", "Skill 2"],
      "availability": true,
      "city": "City of the labor",
      "matchReason": "Explanation why this labor is the best match."
    }
  }`,
});

const matchLaborFlow = ai.defineFlow(
  {
    name: 'matchLaborFlow',
    inputSchema: MatchLaborInputSchema,
    outputSchema: MatchLaborOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

