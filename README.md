# Monopoly Deal Web Clone

A real-time multiplayer web adaptation of the popular Monopoly Deal card game. Built with modern web technologies, this project allows players to create rooms, join lobbies, and play the fast-paced property trading game with friends online.

## 🚀 Features

- **Real-time Multiplayer:** Powered by Supabase real-time subscriptions, ensuring synced game state across all players.
- **Game Lobby System:** Create private rooms with unique codes, wait for friends to join, and start the game when everyone is ready.
- **Interactive Gameplay Mechanics:**
  - Play cards from your hand (Properties, Actions, Money).
  - Target selection for action cards (e.g., Debt Collectors, Sly Deals, Deal Breakers).
  - "Just Say No" chaining mechanics.
  - Action response panels for interactive turns.
- **In-Game Chat:** Communicate with other players in the room using the built-in real-time game chat.
- **Responsive & Beautiful UI:** Styled with Tailwind CSS and Radix UI (shadcn/ui), providing high-fidelity, polished, and responsive card interfaces that mimic the physical deck's aesthetic.

## 🛠 Tech Stack

- **Frontend Framework:** [React 18](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL & Realtime)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) via [shadcn/ui](https://ui.shadcn.com/)
- **State & Data Fetching:** [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Routing:** [React Router](https://reactrouter.com/)

## 📂 Project Structure

```text
src/
├── components/
│   ├── game/          # Game-specific components (Cards, TargetSelector, GameChat, ActionResponsePanel)
│   └── ui/            # Reusable UI components from shadcn/ui
├── data/              # Static game data (e.g., initial cards, deck configurations)
├── hooks/             # Custom React hooks (e.g., use-mobile, use-toast)
├── pages/             # Route pages (Index, Lobby, Game, NotFound)
├── integrations/      # Third-party integrations (Supabase types and clients)
├── lib/               # Utility functions
├── App.tsx            # Main application component & routing
├── main.tsx           # Application entry point
└── index.css          # Global styles, Tailwind directives, and design system variables
supabase/
└── migrations/        # Supabase database schemas and table setup scripts
```

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [Supabase](https://supabase.com/) account and project (for the backend)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd monopoly-deals
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or with bun
   bun install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root of the project and provide your Supabase connection parameters:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The application will be running at `http://localhost:5173` (or the port specified by Vite).*

### Available Scripts

- `npm run dev` - Starts the development server.
- `npm run build` - Builds the app for production.
- `npm run preview` - Previews the production build locally.
- `npm run lint` - Runs ESLint to check for code quality issues.
- `npm run test` - Runs Vitest for running unit tests.

## 🎨 Design System

The application relies heavily on `src/index.css` and `tailwind.config.ts` to define the overarching design system. Most components use semantic design tokens rather than hardcoded colors strictly following SEO-friendly markup and fully responsive design principles.
