# ✦ MusafirAI — AI-Powered Smart Travel Planner

<p align="center">
  <strong>Plan Smarter. Travel Better. Explore More.</strong>
</p>

<p align="center">
  An AI-powered travel planning platform that transforms your trip preferences into a personalized, budget-aware, day-by-day travel itinerary.
</p>

<p align="center">

  <a href="https://musafir-ai-amber.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-MusafirAI-black?style=for-the-badge" alt="Live Demo">
  </a>

  <a href="https://github.com/SanchikaRao/MusafirAI">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>

</p>

---

## 🌍 Overview

**MusafirAI** is an AI-powered travel logistics and itinerary generation platform designed to make trip planning faster, more personalized, and more practical.

Instead of manually searching for destinations, transportation, activities, food options, routes, and budgets, users provide their trip preferences and MusafirAI generates a complete travel blueprint.

The platform combines **Generative AI, structured travel planning, transit logistics, interactive maps, budget allocation, and PDF itinerary generation** into a single application.

### What MusafirAI can generate

* 📍 Personalized destinations and activities
* 🗓️ Day-by-day travel itineraries
* ✈️ Flight and airline suggestions
* 🚆 Train routes and train options
* 🚌 Bus transportation options
* 🚗 Road-trip routes and highway information
* 💰 Budget-aware travel planning
* 🍽️ Dietary preference based recommendations
* 🗺️ Interactive OpenStreetMap locations
* 📄 Multi-day downloadable PDF itineraries

---

## ✨ Key Features

### 🤖 AI-Powered Itinerary Generation

MusafirAI uses **Gemini AI** to transform user requirements into structured travel plans.

The AI considers factors such as:

* Origin
* Destination
* Travel dates
* Group size
* Total budget
* Transportation preference
* Dietary requirements
* Trip duration

The result is a structured itinerary rather than a generic travel recommendation.

---

### 💰 Intelligent Budget Planning

The planner works with the user's overall trip budget and distributes it across major travel categories.

```text
Total Trip Budget
       │
       ├── 🚆 Transportation
       │
       ├── 🏨 Accommodation
       │
       ├── 🍽️ Food
       │
       └── 🎟️ Activities
```

This makes the generated itinerary more practical for real-world travel planning.

---

### 🚆 Multi-Modal Transportation

MusafirAI supports different transportation modes:

| Mode       | Planning                         |
| ---------- | -------------------------------- |
| ✈️ Flight  | Airline and flight information   |
| 🚆 Train   | Train routes and travel duration |
| 🚌 Bus     | Bus operators and routes         |
| 🚗 Car/Cab | Highway and road-trip routes     |

For road travel, the system can provide relevant highway and expressway information to make the journey easier to understand.

---

### 🗺️ Interactive Maps

The application integrates **OpenStreetMap-based mapping** to visualize locations associated with the itinerary.

Users can use the map to understand where their planned activities and destinations are located.

---

### 🍽️ Dietary Personalization

Travel plans can take dietary requirements into account, including:

* Vegetarian
* Jain
* Halal
* Other user preferences

This allows food recommendations to be aligned with the traveler's requirements.

---

### 📄 Multi-Day PDF Export

Generated itineraries can be converted into a print-friendly PDF blueprint.

The PDF organizes the trip sequentially:

```text
Day 1
 ├── Activities
 ├── Food
 ├── Transportation
 └── Locations

Day 2
 ├── Activities
 ├── Food
 ├── Transportation
 └── Locations

Day 3
 └── ...
```

This makes the itinerary convenient to save, print, or share.

---

# 🧠 How It Works

```text
                 USER INPUT
                     │
                     ▼
        ┌─────────────────────────┐
        │     Trip Preferences    │
        │                         │
        │ • Origin                │
        │ • Destination           │
        │ • Dates                 │
        │ • Budget                │
        │ • Group Size            │
        │ • Transport             │
        │ • Dietary Preference    │
        └────────────┬────────────┘
                     │
                     ▼
              ┌─────────────┐
              │  FastAPI    │
              │   Backend   │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │  Gemini AI  │
              │  Generation │
              └──────┬──────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ Structured Itinerary    │
        │                         │
        │ • Daily Activities      │
        │ • Transit               │
        │ • Food                  │
        │ • Budget                │
        │ • Locations             │
        └────────────┬────────────┘
                     │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
      🗺️ Maps    📄 PDF      🖥️ UI
```

---

# 🏗️ Architecture

MusafirAI follows a **frontend + backend architecture**.

```text
┌─────────────────────────────────────────────┐
│                  FRONTEND                   │
│                                             │
│              Next.js 14                     │
│          React + TypeScript                 │
│                                             │
│   Planner → Results → Maps → PDF Export     │
└──────────────────────┬──────────────────────┘
                       │
                       │ API
                       ▼
┌─────────────────────────────────────────────┐
│                  BACKEND                    │
│                                             │
│                 FastAPI                     │
│              Python Services                │
│                                             │
│       Request Validation & Processing       │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                   AI LAYER                  │
│                                             │
│                 Gemini AI                   │
│                                             │
│       Itinerary & Travel Recommendation     │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              OUTPUT SERVICES                │
│                                             │
│      OpenStreetMap │ Budget │ PDF           │
└─────────────────────────────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* **Next.js 14**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **React Leaflet**
* **Leaflet**

## Backend

* **Python**
* **FastAPI**
* **Pydantic**
* REST API architecture

## AI

* **Google Gemini AI**
* Structured AI-generated itinerary responses

## Maps

* **OpenStreetMap**
* **Leaflet**
* **React Leaflet**

## Deployment

* **Vercel** — Frontend
* FastAPI backend deployment supported separately

---

# 📁 Project Structure

```text
MusafirAI/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   ├── planner/
│   │   └── page.tsx
│   │
│   └── itinerary/
│       └── [id]/
│           └── page.tsx
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── services.py
│   └── requirements.txt
│
├── components/
│   └── ...
│
├── lib/
│   └── ...
│
├── types/
│   └── ...
│
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── README.md
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/SanchikaRao/MusafirAI.git

cd MusafirAI
```

---

## 2. Install Frontend Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env.local` file in the project root.

```env
GEMINI_API_KEY=your_gemini_api_key
```

> Never commit API keys or other secrets to GitHub.

---

## 4. Run the Frontend

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## 5. Run the FastAPI Backend

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn main:app --reload
```

The backend will run locally through the FastAPI development server.

---

# 🔐 Environment Variables

| Variable         | Description           | Required |
| ---------------- | --------------------- | -------- |
| `GEMINI_API_KEY` | Google Gemini API key | ✅        |

Additional environment variables can be added as the project integrates more external services.

---

# 📊 Example User Flow

```text
1. Open MusafirAI
        ↓
2. Enter origin & destination
        ↓
3. Select travel dates
        ↓
4. Enter group size
        ↓
5. Set total budget
        ↓
6. Select transportation mode
        ↓
7. Select dietary preference
        ↓
8. Generate itinerary
        ↓
9. Review day-by-day plan
        ↓
10. Explore locations on map
        ↓
11. Export complete itinerary as PDF
```

---

# 🎯 Problem It Solves

Traditional trip planning often requires users to switch between multiple platforms for:

* Transportation
* Hotels
* Restaurants
* Attractions
* Maps
* Route planning
* Budget calculations
* Itinerary creation

MusafirAI aims to bring these planning steps into **one intelligent workflow**.

### Traditional Planning

```text
Search → Compare → Calculate → Map → Organize → Rewrite → Repeat
```

### MusafirAI

```text
Preferences
     ↓
AI Processing
     ↓
Personalized Travel Blueprint
```

---

# 🌟 Why MusafirAI?

### Personalization

Every itinerary is generated from the user's own travel constraints.

### Practical Planning

The system considers budget, transportation, duration, group size, and dietary preferences.

### Structured Output

Instead of returning only conversational AI text, MusafirAI produces a structured travel plan.

### Visual Planning

Interactive maps help users understand the geographic relationship between planned locations.

### Portable Itineraries

The PDF export turns the generated plan into a travel-ready document.

---

# 🔮 Future Improvements

* [ ] Real-time flight and train availability
* [ ] Live hotel price integration
* [ ] Real-time weather integration
* [ ] Google Maps / advanced routing integration
* [ ] Expense tracking during the trip
* [ ] Collaborative group trip planning
* [ ] User accounts and saved itineraries
* [ ] Multi-language support
* [ ] Voice-based trip planning
* [ ] Destination discovery based on interests
* [ ] Real-time itinerary modification
* [ ] Travel alerts and notifications
* [ ] AI-powered hotel recommendations
* [ ] Currency conversion for international trips

---

# 🚧 Current Limitations

MusafirAI is an AI-powered planning system and generated transportation details should be **verified with official travel providers before booking**.

AI-generated schedules and prices may change because real-world transportation and travel information is dynamic.

The project is primarily focused on **travel planning and itinerary generation**, rather than directly booking tickets or accommodations.

---

# 🔗 Links

### 🌐 Live Application

https://musafir-ai-amber.vercel.app/

### 💻 GitHub Repository

https://github.com/SanchikaRao/MusafirAI

---

# 👩‍💻 Author

**Sanchika Rao**

GitHub:
https://github.com/SanchikaRao

---

# ⭐ Support

If you find MusafirAI interesting, consider giving the repository a ⭐ on GitHub.

---

<p align="center">
  Built with ❤️ using Next.js, FastAPI & Gemini AI
</p>
