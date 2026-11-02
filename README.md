# ✨ Aura — Emotionally Intelligent AI Companion

A full-stack chat app with an AI companion that notices how you feel and answers with empathy.

| Layer | Tech |
|---|---|
| Frontend | React Native (Expo SDK 58), React Navigation, runs on Android, iOS and Web |
| Backend | PHP 8.2+ REST API (no framework, no Composer) |
| Database | MariaDB 10.4+ or MySQL 8.0+ |
| AI | Google Gemini API (free tier), with a built-in offline empathy engine as fallback |

## Features

- **Auth**: sign up, log in, log out. Passwords are hashed with bcrypt; tokens are stored as SHA-256 hashes and expire after 30 days.
- **Chat**: gradient chat bubbles, timestamps, animated typing indicator, optimistic sending with tap-to-retry, suggestion prompts, and Enter-to-send on web.
- **Emotional intelligence**:
  - Each message is tagged with one of 12 emotions plus an intensity (1–5).
  - Replies use the last 20 messages, your name, your latest mood check-in and your weekly mood trend.
  - Messages about self-harm always get crisis helpline information.
- **History**: every conversation is saved in the database. You can search them, delete one, or clear everything.
- **Mood tracker**: daily check-in (mood, intensity, note), streak counter, 14-day mood chart, 30-day breakdown.
- **Mood-based Home**: greeting based on time of day and mood, a daily tip, and a "talk it through" prompt when your mood is low.
- **Profile**: emoji avatar, name, change password, stats, and **System / Light / Dark** theme saved to your account.
- **Error handling**: friendly error banners, loading spinners, pull-to-refresh, offline-mode notices.

## Project structure

```
├── backend/                  PHP REST API
│   ├── public/index.php      Front controller + route table
│   ├── public/.htaccess      Apache/XAMPP rewrite rules
│   ├── src/
│   │   ├── Config.php, Database.php, Http.php, Router.php, Auth.php, Validator.php, Emotions.php
│   │   ├── Controllers/      AuthController, ProfileController, ChatController, MoodController
│   │   └── Services/         CompanionService (prompt + orchestration), GeminiService,
│   │                         EmotionDetector (offline NLP), OfflineResponder
│   ├── .env.example          Config template (DB + Gemini key; secrets stay on the server)
│   └── start-server.bat      One-click dev server for Windows
├── database/schema.sql       Database + tables
├── start-app.bat             One-click launcher (backend + frontend)
├── docs/API.md               Full REST API reference
└── frontend/                 Expo React Native app
    ├── App.js
    └── src/
        ├── api/              fetch client + endpoint functions
        ├── components/       ChatBubble, ChatInput, TypingIndicator, MoodPicker, GradientButton, TextField, …
        ├── constants/        emotions (labels, emoji, colours, greetings, tips)
        ├── context/          AuthContext, ThemeContext
        ├── navigation/       Stack + bottom tabs
        ├── screens/          Welcome, Login, Register, Home, Chat, History, Mood, Profile
        ├── theme/            Light/dark design tokens
        └── utils/            time formatting, cross-platform confirm dialogs
```

## How to run (step by step)

### Step 0 — Install the tools (one time only)

| Tool | Version | Check it with | Download |
|---|---|---|---|
| Node.js | 20 or newer (tested on 22) | `node -v` | <https://nodejs.org> |
| PHP | 8.2 or newer | `php -v` | <https://windows.php.net/download> |
| MySQL or MariaDB | MySQL 8.0+ / MariaDB 10.4+ | MySQL Workbench, or the `mysql` command | <https://dev.mysql.com/downloads/installer/> |
| Expo Go app (optional, for phones) | latest | — | Play Store / App Store |

Make sure `node` and `php` work in a new terminal. If not, add their folders to your Windows `PATH`.

### Step 1 — Start MySQL

Make sure your MySQL / MariaDB server is running (Windows: *Services → MySQL80 → Start*, or start it from XAMPP / WAMP).

### Step 2 — Create the database (one time only)

Run the schema file. It creates the `aura_chat` database and all tables:

```bash
mysql -u root -p < database/schema.sql
```

No `mysql` command? Open `database/schema.sql` in **MySQL Workbench** or **phpMyAdmin** and run the whole file.

### Step 3 — Configure the backend (one time only)

```bash
cd backend
copy .env.example .env        # macOS/Linux: cp .env.example .env
```

Open `backend/.env` and set:

| Setting | What to put |
|---|---|
| `DB_HOST`, `DB_PORT` | Usually `127.0.0.1` and `3306` |
| `DB_NAME` | `aura_chat` |
| `DB_USER`, `DB_PASS` | Your MySQL username and password |
| `GEMINI_API_KEY` | Optional. A free key from <https://aistudio.google.com/apikey>. Leave it empty to use the built-in offline replies. |

### Step 4 — Install the frontend packages (one time only)

```bash
cd frontend
npm install
```

This takes a few minutes the first time. If you add packages later, use `npx expo install <package>` so the version matches Expo SDK 58.

### Step 5 — Start the app

**Option A — one click (Windows):** double-click **`start-app.bat`** in the project folder. It opens two windows: **Aura API** (backend) and **Aura App** (Expo).

**Option B — by hand, in two terminals:**

Terminal 1 (backend):
```bash
cd backend
start-server.bat
# or: php -d extension=pdo_mysql -S 0.0.0.0:8000 -t public public/index.php
```

Terminal 2 (frontend):
```bash
cd frontend
npx expo start
```

> `-d extension=pdo_mysql` turns on PHP's MySQL driver for this run only. To turn it on permanently, remove the `;` in front of `extension=pdo_mysql` in your `php.ini`.

### Step 6 — Check the backend

Open <http://localhost:8000/api/health> in your browser. You should see:

```json
{"status":"ok","database":"ok","ai":"gemini"}
```

`"ai":"offline"` means no Gemini key is set. The app still works, with simpler replies.

### Step 7 — Open the app

In the Expo terminal (the **Aura App** window):
- Press **`w`** to open it in your web browser (quickest).
- Or scan the QR code with the **Expo Go** app on your phone. The phone must be on the same Wi-Fi as your computer.
- Or press **`a`** to open it in an Android emulator.

### Step 8 — Use it

1. Tap **Get started** and create an account (name, email, password).
2. **Home** shows a greeting, a daily tip and your mood.
3. **Chat** — type how you feel. Aura detects the emotion and replies with empathy.
4. **History** — search, open or delete past conversations.
5. **Mood** — do a daily check-in and see your 14-day chart and streak.
6. **Profile** — change avatar, name, password and theme (System / Light / Dark), or log out.

### Stopping the app

Press **Ctrl + C** in both windows (or just close them).

### Running on a phone: connecting to the backend

The app finds the backend automatically: on web it uses the page's host on port 8000, and on a phone it uses your computer's Wi-Fi IP from Expo. If that doesn't work (for example with `--tunnel`), create `frontend/.env` with your computer's IP (find it with `ipconfig`):

```
EXPO_PUBLIC_API_URL=http://192.168.1.20:8000/api
```

Then restart `npx expo start`.

### Troubleshooting

| Problem | Fix |
|---|---|
| "Can't reach the server…" | Make sure the backend is running. On a phone, allow PHP through Windows Firewall (private networks) and check that both devices are on the same Wi-Fi. |
| `npm install` is very slow or stuck | Stop it (Ctrl + C), check your internet, then run `npm install` again. It resumes from what is already downloaded. |
| `'expo' is not recognized` | `npm install` did not finish. Run `npm install` again inside `frontend`. |
| Port 8000 already in use | Close the other program using it, or start PHP on another port (e.g. `-S 0.0.0.0:8080`) and set `EXPO_PUBLIC_API_URL=http://localhost:8080/api` in `frontend/.env`. |
| "pdo_mysql is not enabled" | Start PHP with `-d extension=pdo_mysql` (as shown above) or enable it in php.ini. |
| "Could not connect to the database" | Check `DB_*` in `backend/.env` and that MySQL/MariaDB is running. |
| Replies end in "· offline" | No Gemini key, or Gemini is busy or over quota. The errors are printed in the PHP server console. You can change `GEMINI_MODELS` in `.env`. |
| SSL certificate error in the PHP log | Set `CA_BUNDLE=C:\path\to\cacert.pem` (download from <https://curl.se/ca/cacert.pem>). |

## Security notes

- The Gemini API key exists only in `backend/.env`, which is git-ignored, and the app never sees it.
- All SQL uses prepared statements. Every conversation and mood query is scoped to the logged-in user.
- For production: use HTTPS, set `CORS_ORIGINS` to your domain, set `APP_DEBUG=false`, and use a dedicated DB user instead of `root`.

> Aura is a supportive companion, **not** a replacement for professional mental-health care.
