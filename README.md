
# LabourLink - Construction Labour Marketplace

LabourLink is a Next.js-based web application designed to connect skilled construction labour with customers who need their expertise. It serves as a marketplace facilitating job postings, labour discovery, and AI-powered matching.

## Features

**For Customers:**
*   **User Registration & Login:** Secure account creation and login.
*   **Post Jobs:** Easily create job postings with details like title, description, required skills, location, duration, and budget.
*   **AI-Powered Job Description Generation:** Generate job descriptions based on keywords using Genkit.
*   **Manage Job Posts:** View, edit, and delete their job postings.
*   **AI Labour Matching:** Get AI-powered suggestions for the best labour matches for their job posts.
*   **View Applications:** (Conceptual) View applications from labour users for their jobs.
*   **Directly Offer Jobs:** (Conceptual) Offer jobs directly to labour profiles.

**For Labour Users:**
*   **User Registration & Login:** Secure account creation and login.
*   **Profile Management:** Create and update their profile with skills, city, availability, work history, and profile picture.
*   **Browse Jobs:** Search and filter available job postings.
*   **Apply for Jobs:** (Conceptual) Apply for jobs that match their skills and preferences.
*   **AI Job Suggestions:** Receive AI-powered job notifications relevant to their profile.
*   **Manage Applications:** Track the status of their job applications.
*   **Manage Job Offers:** View and respond to direct job offers from customers.
*   **Subscription Management:** (Conceptual) Manage their subscription plan for accessing premium features.

**For Admin Users:**
*   **Admin Dashboard:** Overview of platform statistics.
*   **Manage Users:** View all registered users, filter them, and disable/enable their accounts.
*   **Manage Jobs:** View all job posts on the platform, filter them, and mark jobs as deleted.

## Tech Stack

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) (v15 with App Router)
    *   [React](https://reactjs.org/) (v18)
    *   [TypeScript](https://www.typescriptlang.org/)
*   **UI:**
    *   [ShadCN UI](https://ui.shadcn.com/) - Beautifully designed components.
    *   [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework.
    *   [Lucide React](https://lucide.dev/) - Icon library.
*   **AI / Generative Features:**
    *   [Genkit (Firebase Genkit)](https://firebase.google.com/docs/genkit) - For building AI-powered features.
    *   Google AI Models (e.g., Gemini via Genkit)
*   **State Management:** React Context API (`useAuth` hook).
*   **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation.
*   **Mock Backend:**
    *   A mock Firebase implementation using `localStorage` for data persistence during development (auth, users, jobs, applications, direct job offers). This is located in `src/lib/firebase.ts`.

## Project Structure

```
/
├── src/
│   ├── ai/                 # Genkit AI flows and configuration
│   │   ├── flows/          # Specific AI flow implementations
│   │   └── genkit.ts       # Genkit global initialization
│   ├── app/                # Next.js App Router (pages, layouts)
│   │   ├── (auth)/         # Routes requiring authentication
│   │   ├── admin/          # Admin-specific routes
│   │   ├── customer/       # Customer-specific routes
│   │   ├── labour/         # Labour-specific routes
│   │   ├── api/            # API routes (if any, currently Genkit handles AI backend)
│   │   ├── globals.css     # Global styles and Tailwind directives
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Auth related components (AuthGuard, RoleGuard)
│   │   ├── forms/          # Form components (Login, Register, JobPost, LabourProfile)
│   │   ├── jobs/           # Job related components (JobCard)
│   │   ├── labour/         # Labour related components (LabourCard)
│   │   ├── layout/         # Layout components (Header, Footer, ThemeToggle)
│   │   └── ui/             # ShadCN UI components
│   ├── config/             # Site configuration (navigation, skills, cities, etc.)
│   ├── contexts/           # React Context providers (AuthContext)
│   ├── hooks/              # Custom React hooks (useAuth, useToast, useMobile)
│   ├── lib/                # Utility functions and libraries
│   │   ├── firebase.ts     # Mock Firebase implementation
│   │   └── utils.ts        # General utility functions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── .env                    # Environment variables (empty by default in prototype)
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### Installation

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd labourlink-project
    ```
    (If you are in Firebase Studio, the code is already present.)

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root of the project. Currently, this prototype does not require specific environment variables to run the core mock functionality. If deploying or connecting to real services (like actual Firebase or AI APIs), you would add them here.
    Example `.env` (currently not strictly needed for mock):
    ```env
    # Example for future Firebase integration (not used by mock)
    # NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    # ... other Firebase config
    ```

### Running the Development Server

To start the Next.js development server:

```bash
npm run dev
```
The application will typically be available at `http://localhost:9002`.

### Running the Genkit Development Server

If you want to run and test Genkit flows separately or use the Genkit developer UI:
(Ensure you have Genkit CLI installed and configured if running outside a managed environment like Firebase Studio)

```bash
npm run genkit:dev
# or for watching changes
npm run genkit:watch
```
The Genkit developer UI is usually available at `http://localhost:4000`.
The Next.js app uses server actions to call these flows, so `genkit:dev` is not strictly necessary for the app to function with its current AI integration.

## Available Scripts

In the `package.json`, you can find several scripts:

*   `dev`: Starts the Next.js development server with Turbopack on port 9002.
*   `genkit:dev`: Starts the Genkit development server.
*   `genkit:watch`: Starts the Genkit development server with file watching.
*   `build`: Builds the Next.js application for production.
*   `start`: Starts the Next.js production server.
*   `lint`: Runs Next.js ESLint.
*   `typecheck`: Runs TypeScript type checking.

## Firebase Mock Implementation

This project uses a **mock Firebase implementation** found in `src/lib/firebase.ts`.
*   **Authentication:** Mocked user authentication state is persisted in `localStorage`.
*   **Database:** User profiles, job postings, applications, and direct job offers are stored in JavaScript objects that are persisted to `localStorage`. This allows for a fully interactive prototype experience without needing a live Firebase backend setup.
*   When the application starts, it loads data from `localStorage` if available, otherwise it uses initial mock data.

## AI Features (Genkit)

AI-powered features are implemented using Genkit. The flows are defined in `src/ai/flows/`.
*   `job-description-generator.ts`: Generates job descriptions from keywords.
*   `labor-match.ts`: Matches available labour to job posts based on skills, location, etc.
*   `relevant-job-notifications.ts`: Provides a curated list of relevant jobs for labour users.

These flows are called as server actions from the frontend components.

## Contributing

This is a prototype project. If this were an open-source project, contribution guidelines would be listed here. For now, focus on extending features and improving the existing codebase.

---

This README provides a good overview for anyone looking to understand or contribute to the LabourLink project.
