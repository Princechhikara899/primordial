// frontend/src/App.jsx
// Main Application Routing Configuration

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExploreChallengesPage from './pages/ExploreChallengesPage';
import CreateChallengePage from './pages/CreateChallengePage';
import ChallengeDetailsPage from './pages/ChallengeDetailsPage';
import JoinedChallengesPage from './pages/JoinedChallengesPage';
import CheckInHistoryPage from './pages/CheckInHistoryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import GroupChatPage from './pages/GroupChatPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ExploreChallengesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes (Require Session Authentication) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateChallengePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/challenges/:id"
              element={
                <ProtectedRoute>
                  <ChallengeDetailsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/challenges/:id/leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/challenges/:id/chat"
              element={
                <ProtectedRoute>
                  <GroupChatPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/joined"
              element={
                <ProtectedRoute>
                  <JoinedChallengesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <CheckInHistoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
