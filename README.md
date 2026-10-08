# 🌱 Primordial

### Social Accountability Platform for Achieving Goals Together

**Primordial** is a social accountability platform that helps people stay consistent with their personal goals by turning goal tracking into a shared experience.

Users can create challenges around goals such as **fitness, studying, reading, coding, or personal habits**, invite friends or join public communities, check in daily, maintain streaks, compete on leaderboards, and motivate each other through real-time group interactions.

---

## 🎯 Problem

Many people start personal goals with motivation but struggle to stay consistent because they lack **accountability and social support**.

Traditional habit and goal-tracking applications mainly focus on individual progress. Primordial adds a social layer where users can work toward their goals together.

> **The idea is simple: achieving a goal is easier when someone else is counting on you.**

---

## 💡 What Primordial Provides

* Create personal or group challenges
* Join public challenges with people who share similar goals
* Create private challenges for friends
* Check in daily and record progress
* Maintain and track streaks
* Compete through live leaderboards
* Add optional notes or photo proof
* Chat with other challenge members
* Receive reminders when daily check-ins are missed
* Motivate teammates with quick nudges
* View challenge history and completion statistics

---

## ✨ Core Features

### 🔐 Authentication

* User registration and login
* Secure authentication
* User profiles

### 🎯 Challenges

Create challenges with:

* Goal
* Description
* Duration
* Start and end dates
* Public/private visibility
* Challenge members

### 👥 Groups

Users can:

* Create private groups
* Share invite links
* Discover public challenges
* Join challenges with other users

### ✅ Daily Check-ins

Members can record their daily progress.

Check-ins can include:

* Completion status
* Optional notes
* Optional photo proof

### 🔥 Streak Tracking

Primordial automatically tracks consecutive successful check-ins and calculates user streaks.

### 🏆 Leaderboard

Challenge members are ranked based on their progress and consistency.

### 💬 Real-Time Group Chat

Every challenge can have a dedicated group chat where members can:

* Send messages
* Encourage teammates
* Discuss progress
* Celebrate milestones

### 🔔 Reminders & Motivation

Users can receive reminders when they haven't completed their daily check-in.

Members can also send quick motivation nudges to teammates.

### 📊 Progress & History

Users can view:

* Completed challenges
* Previous streaks
* Challenge performance
* Completion statistics
* Personal progress history

---

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* HTML5
* CSS3

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL

### Real-Time Communication

* Socket.IO / WebSockets

### Development Tools

* Git
* GitHub
* VS Code

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    React Frontend   │
                    └──────────┬──────────┘
                               │
                     REST API  │  WebSocket
                               │
                               ▼
                 ┌──────────────────────────┐
                 │    Node.js + Express     │
                 │      Backend Server      │
                 └────────────┬─────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
       ┌──────────────────┐       ┌─────────────────┐
       │   PostgreSQL     │       │    Socket.IO    │
       │     Database     │       │  Real-time Chat │
       └──────────────────┘       └─────────────────┘
```

---

## 🗄️ Main Data Entities

The application is
