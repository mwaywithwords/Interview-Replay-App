// Type definitions for Interview Replay
// Add your custom types here

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Session {
  user: User | null;
  isAuthenticated: boolean;
}
