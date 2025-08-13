# 🏃‍♂️ Race Your Friends - Strava Fitness Challenge App

A real-time fitness competition app that lets you race against friends using actual Strava data. Think TypeRacer meets fitness challenges!

## ✨ Features

- **🏆 Real Strava Integration**: Connect your Strava account and compete with real activity data
- **⚡ Real-Time Competition**: See live progress updates as friends complete activities
- **🎯 Multi-Sport Challenges**: Support for running, cycling, swimming, walking, hiking, and strength training
- **👥 Social Sharing**: Create challenges and invite friends via shareable links
- **📱 Responsive Design**: Beautiful, modern UI that works on all devices
- **🎮 Demo Mode**: Try the app with sample data before connecting Strava

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Authentication**: Strava OAuth 2.0
- **State Management**: React Context API
- **Database**: PostgreSQL + Prisma (ready for production)
- **Docker**: Containerized development environment

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Challenge/      # Challenge creation and management
│   ├── Home/           # Landing page and navigation
│   ├── Layout/         # Header and layout components
│   ├── Race/           # Race view and competition
│   ├── Strava/         # Strava integration components
│   └── ui/             # Reusable UI components
├── context/            # React Context providers
├── services/           # Business logic and API services
├── types/              # TypeScript type definitions
└── lib/                # Utility functions and database
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (for database)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file:
```env
VITE_STRAVA_CLIENT_ID=your_strava_client_id
VITE_STRAVA_CLIENT_SECRET=your_strava_client_secret
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Open in Browser
Navigate to `http://localhost:5173`

## 🔐 Strava Setup

1. **Create Strava App**: Go to [Strava API Settings](https://www.strava.com/settings/api)
2. **Get Credentials**: Note your Client ID and Client Secret
3. **Set Redirect URI**: Use `http://localhost:5173/api/auth/callback/strava`
4. **Add to .env**: Update your environment variables

## 🏆 How to Use

### Creating a Challenge
1. **Connect Strava**: Click "Connect Strava" on the landing page
2. **Create Challenge**: Choose sports, duration, and settings
3. **Share**: Get a shareable link to invite friends
4. **Compete**: Track progress in real-time

### Joining a Challenge
1. **Get Invite Link**: From a friend or challenge creator
2. **Connect Strava**: If you haven't already
3. **Join**: Automatically added to the challenge
4. **Race**: Your activities count toward the challenge goal

## 🐳 Docker Development

### Start Services
```bash
docker-compose up -d
```

This starts:
- **PostgreSQL**: Database for challenges and users
- **Redis**: Caching and session storage

### Stop Services
```bash
docker-compose down
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## 🔧 Configuration

### Environment Variables
- `VITE_STRAVA_CLIENT_ID` - Strava OAuth client ID
- `VITE_STRAVA_CLIENT_SECRET` - Strava OAuth client secret
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret

### Strava API Limits
- **Rate Limiting**: 1000 requests per 15 minutes
- **Activity Scope**: Read access to your activities
- **Real-Time**: Shows activities from last 2 days only

## 🚧 Development Notes

- **Demo Mode**: Use `/race/demo-challenge` for testing without Strava
- **Hot Reload**: Vite provides fast development experience
- **Type Safety**: Full TypeScript support with strict mode
- **Responsive**: Mobile-first design approach

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Strava API** for fitness data integration
- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first styling
- **Framer Motion** for smooth animations

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/project/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/project/discussions)
- **Email**: your-email@example.com

---

**Ready to race? Connect your Strava and start competing! 🏃‍♂️💨**
