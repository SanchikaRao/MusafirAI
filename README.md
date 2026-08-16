# ✦ MusafirAI — Smart Travel Planning Engine

MusafirAI is an AI-powered travel logistics platform that generates customized day-by-day itineraries, specific transit options (airline flight numbers, train routes, bus operators, and driving highways), interactive OpenStreetMap routing, and full multi-day PDF export.

---

## 🌟 Features

- **Pacing & Budget Engine:** Automatically distributes your total budget across transit, stay, and daily activities.
- **Realistic Transit Details:**
  - ✈️ **Flight:** Airline flight numbers & schedules (e.g., IndiGo 6E-205, Air India).
  - 🚆 **Train:** Named express trains (e.g., Goa Express) and transit duration.
  - 🚌 **Bus:** Verified Volvo/State RTC operators.
  - 🚗 **Car/Cab:** Specific National Highways (e.g., NH 48), expressway routes, and toll guidance.
- **Dietary Alignment:** Curates meals based on preferences (Vegetarian, Jain, Halal, etc.).
- **Interactive OpenStreetMap:** Embedded location coordinates for all daily activities.
- **Multi-Day PDF Export:** Print-optimized layout rendering all days sequentially.

---

## 🛠️ Project Structure

```text
TripPlanner/
├── app/                  # Next.js App Router (Frontend)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── planner/
│   │   └── page.tsx
│   └── itinerary/[id]/
│       └── page.tsx
├── backend/              # FastAPI Python Engine (Backend)
│   ├── main.py
│   ├── models.py
│   ├── services.py
│   └── requirements.txt
├── components/
├── package.json
└── tailwind.config.js