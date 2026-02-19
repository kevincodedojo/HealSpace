# HealSpace

A therapeutic program booking system for healthcare facilities. Patients can browse wellness programs across categories like art therapy, music therapy, animal therapy, and more — then book sessions through an interactive calendar interface.

Built with **Node.js**, **Express**, **MySQL**, and **EJS**.

## Features

- **Browse Programs** — Explore 19 therapeutic programs across 5 categories (Art Therapy, Music Therapy, Technology, Animal Therapy, Spiritual Care)
- **User Authentication** — Secure registration and login with bcrypt password hashing
- **Interactive Booking** — Calendar-based date picker with real-time time slot availability via AJAX
- **Capacity Management** — Automatic tracking of available spots per time slot
- **Booking Management** — View upcoming and past bookings, cancel reservations with spot restoration
- **Profile Management** — Update personal information (name, birthday, room number, phone)
- **Responsive Design** — Mobile-friendly layout with hamburger navigation
- **Auto-Generated Schedules** — Time slots are automatically created from recurring program schedules on server startup

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Runtime   | Node.js                             |
| Framework | Express 5                            |
| Database  | MySQL                               |
| Templating| EJS                                  |
| Auth      | bcrypt + express-session             |
| Styling   | CSS3 (Flexbox / Grid)               |

## Project Structure

```
HealSpace/
├── index.mjs                # Express server & all routes
├── HealSpaceDB.sql          # Database schema & seed data
├── package.json
├── .env                     # Environment variables (not committed)
├── views/
│   ├── partials/
│   │   ├── header.ejs       # HTML head & meta tags
│   │   ├── nav.ejs          # Navigation bar
│   │   └── footer.ejs       # Page footer
│   ├── index.ejs            # Home — category grid
│   ├── programs.ejs         # Program listings (all or filtered)
│   ├── book.ejs             # Booking calendar & time slot picker
│   ├── login.ejs            # Login form
│   ├── register.ejs         # Registration form
│   ├── register-success.ejs # Registration confirmation
│   ├── my-bookings.ejs      # User's bookings (upcoming / past)
│   ├── my-profile.ejs       # Profile editor
│   └── bookings.ejs         # Login prompt for unauthenticated users
├── public/
│   ├── css/styles.css       # All styles
│   ├── js/scripts.js        # Client-side JS (nav, toasts)
│   └── img/
│       ├── categories/      # 5 category images
│       └── programs/        # 19 program images
└── tests/                   # Automated tests
```

## Database Schema

```
categories ──< programs ──< program_schedules
                   │                 │
                   │                 └──< time_slots ──< bookings
                   │                                        │
                   └────────────────────────────── users ───┘
```

**6 tables:** `categories`, `programs`, `users`, `program_schedules`, `time_slots`, `bookings`

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL](https://www.mysql.com/) (v8.0 or higher)

### 1. Clone the repository

```bash
git clone https://github.com/kevincodedojo/HealSpace.git
cd HealSpace
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

```bash
mysql -u root -p < HealSpaceDB.sql
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=healspace
```

### 5. Start the server

```bash
node index.mjs
```

The app will be running at **http://localhost:3000**

### 6. Run tests

```bash
npm test
```

## API Endpoint

| Method | Endpoint                          | Description                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| GET    | `/api/time-slots/:programId?date=` | Returns available time slots as JSON (AJAX)  |

## Routes

| Method | Route                      | Auth | Description                     |
| ------ | -------------------------- | ---- | ------------------------------- |
| GET    | `/`                        | No   | Home — browse categories        |
| GET    | `/programs`                | No   | All programs                    |
| GET    | `/programs/category/:id`   | No   | Programs filtered by category   |
| GET    | `/login`                   | No   | Login page                      |
| POST   | `/login`                   | No   | Login submit                    |
| GET    | `/register`                | No   | Registration page               |
| POST   | `/register`                | No   | Registration submit             |
| GET    | `/my-bookings`             | Yes  | User's bookings                 |
| GET    | `/book/:programId`         | Yes  | Booking calendar page           |
| POST   | `/book`                    | Yes  | Create a booking                |
| POST   | `/cancel-booking/:id`      | Yes  | Cancel a booking                |
| GET    | `/my-profile`              | Yes  | View profile                    |
| POST   | `/my-profile`              | Yes  | Update profile                  |
| GET    | `/logout`                  | Yes  | Destroy session & redirect      |

## License

ISC
