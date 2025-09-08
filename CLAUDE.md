# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Project Architecture

CalorieLens is a React application built with TypeScript that helps users track their daily calorie intake by analyzing food images. The application uses Supabase for data storage and backend services.

### Key Components

- **App.tsx**: Main application component that orchestrates the entire application flow and state management.

- **Component Structure**:
  - `ImageUploader`: Handles image upload functionality using react-dropzone
  - `ResultsDisplay`: Shows food analysis results with calorie information
  - `HistoryList`: Displays past food analyses
  - `DetailPopup`: Shows detailed information about a specific history item
  - `DailyCalorieTracker`: Tracks daily calorie intake against a goal
  - `Header/Footer`: Navigation and UI structure components

- **Service Layer**:
  - `foodDetectionService.ts`: Handles image analysis (currently uses mock data based on filename)
  - `historyService.ts`: Manages saving and retrieving analysis history
  - `dailyCalorieService.ts`: Handles calorie goal management and calculations
  - `supabaseClient.ts`: Initializes Supabase client
  - `supabaseSetup.ts`: Sets up database schema and tables
  - `supabaseDataService.ts`: Provides methods for data operations
  - `supabaseStorageService.ts`: Handles image storage in Supabase

### Data Flow

1. User uploads a food image via the ImageUploader component
2. The image is processed by the foodDetectionService
3. Results are displayed in the ResultsDisplay component
4. User can save the analysis to history
5. Saved analyses are stored in Supabase and displayed in the HistoryList
6. The DailyCalorieTracker component shows progress toward daily calorie goals

### Database Schema

- **food_analyses**: Stores metadata about each analysis session
- **food_items**: Stores individual food items detected in an analysis
- **calorie_goals**: Stores user's daily calorie goals

### Storage

- Uses Supabase Storage with a 'food-images' bucket for storing uploaded food images

## Notes

- The application is currently using mock data for food detection based on image filenames. The real implementation would involve an actual AI food detection service.
- Authentication is not yet implemented but the codebase is structured to accommodate it in the future.
- The project uses styled-components for styling with a theme defined in theme.ts.