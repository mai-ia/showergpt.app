# 🚿 ShowerGPT

A whimsical React application that generates thought-provoking shower thoughts using AI or template-based generation, with optional user authentication and cloud sync.

## ✨ Features

- **AI-Powered Generation**: Uses OpenAI GPT-3.5-turbo for creative shower thoughts
- **Template Fallback**: Works perfectly without API keys using built-in templates
- **User Authentication**: Sign up, sign in, and manage your profile with Supabase
- **Cloud Sync**: Save and sync your thoughts across devices (when authenticated)
- **Multiple Moods**: Philosophical, humorous, and scientific thought styles
- **Smart Rate Limiting**: Cost-controlled API usage for hackathons
- **Local Storage**: Save favorites and maintain history locally
- **Export Functionality**: Download thoughts as text files
- **Responsive Design**: Beautiful UI that works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd showergpt
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Optional: Enable AI features**:
   - Copy `.env.example` to `.env`
   - Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Add your key: `VITE_OPENAI_API_KEY=your_key_here`
   - Restart the dev server

4. **Optional: Enable authentication**:
   - Create a project at [Supabase](https://supabase.com)
   - Get your project URL and anon key from Settings → API
   - Add to `.env`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Restart the dev server

## 🔧 Environment Configuration

### Required for AI Features
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Required for Authentication
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Settings
```env
# Enable development mode with mock data
VITE_DEV_MODE=true

# Customize API rate limiting
VITE_API_RATE_LIMIT=10
VITE_API_RATE_WINDOW_HOURS=1
```

## 🎯 Usage

### Without Any Configuration
- App works immediately with creative template-based generation
- All features available except AI-powered thoughts and authentication
- Perfect for development and testing

### With OpenAI API Key
- Toggle between AI and template generation
- Real-time usage tracking
- Cost optimization with rate limiting
- Enhanced creativity with GPT-3.5-turbo

### With Supabase Authentication
- User registration and login
- Profile management
- Cloud sync of thoughts and preferences
- Cross-device synchronization

## 🛡️ Cost Control

The app includes several cost optimization features:

- **Rate Limiting**: 10 API calls per hour by default
- **Token Limits**: Max 100 tokens per response
- **Usage Tracking**: Real-time cost and token monitoring
- **Smart Fallbacks**: Automatic template generation when limits reached

## 🏗️ Architecture

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── InputSection.tsx
│   ├── ThoughtCard.tsx
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # External service integrations
│   └── supabase.js
├── config/            # Environment configuration
├── data/              # Mock data for development
├── services/          # API services
├── types/             # TypeScript definitions
└── utils/             # Utility functions
```

## 🔐 Authentication Features

### User Management
- Email/password registration and login
- Password reset functionality
- User profile management
- Display name and bio customization

### Data Sync
- Cloud storage of user thoughts
- Cross-device synchronization
- Favorite thoughts sync
- User preferences sync

### Security
- Row Level Security (RLS) enabled
- Secure authentication with Supabase
- Client-side session management
- Automatic token refresh

## 🗄️ Database Schema

When using Supabase, the app expects these tables:

### `user_profiles`
- `user_id` (uuid, references auth.users)
- `display_name` (text)
- `bio` (text)
- `favorite_mood` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `shower_thoughts`
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `content` (text)
- `topic` (text)
- `mood` (text)
- `source` (text)
- `tokens_used` (integer)
- `cost` (decimal)
- `created_at` (timestamp)

## 🔒 Security Notes

- API keys are client-side (VITE_ prefix)
- For production, consider backend API proxy
- Rate limiting prevents excessive usage
- Supabase handles authentication security
- Row Level Security protects user data

## 🎨 Customization

### Adding New Thought Templates
Edit `src/utils/thoughtGenerator.ts` to add new templates.

### Modifying AI Prompts
Update `src/services/openaiService.js` prompt templates.

### Styling Changes
Uses Tailwind CSS - modify classes in components.

### Authentication Flow
Customize `src/components/auth/` components for different auth flows.

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly interactions
- Optimized for all screen sizes

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
Set all required environment variables in your deployment platform:
- `VITE_OPENAI_API_KEY` (optional)
- `VITE_SUPABASE_URL` (optional)
- `VITE_SUPABASE_ANON_KEY` (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### API Key Issues
- Ensure OpenAI key starts with 'sk-'
- Check OpenAI account billing
- Verify key permissions

### Supabase Issues
- Verify project URL format
- Check anon key permissions
- Ensure project is not paused

### Development Issues
- Clear browser localStorage
- Restart development server
- Check console for errors

### Rate Limiting
- Wait for reset time
- Use template generation
- Adjust rate limits in config

## 🎉 Hackathon Ready

This app is optimized for hackathon use:
- Quick setup (works without any API keys)
- Cost-controlled AI usage
- Professional UI/UX with authentication
- Full feature set including user management
- Easy customization and extension
- Multiple deployment options

Perfect for demonstrating AI integration, React skills, authentication flows, and creative problem-solving!