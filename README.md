# 🚿 ShowerGPT

A whimsical React application that generates thought-provoking shower thoughts using AI or template-based generation.

## ✨ Features

- **AI-Powered Generation**: Uses OpenAI GPT-3.5-turbo for creative shower thoughts
- **Template Fallback**: Works perfectly without API keys using built-in templates
- **Multiple Moods**: Philosophical, humorous, and scientific thought styles
- **Smart Rate Limiting**: Cost-controlled API usage for hackathons
- **Local Storage**: Save favorites and maintain history
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

## 🔧 Environment Configuration

### Required for AI Features
```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
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

### Without API Key
- App works immediately with creative template-based generation
- All features available except AI-powered thoughts
- Perfect for development and testing

### With API Key
- Toggle between AI and template generation
- Real-time usage tracking
- Cost optimization with rate limiting
- Enhanced creativity with GPT-3.5-turbo

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
├── config/             # Environment configuration
├── data/               # Mock data for development
├── services/           # API services
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

## 🔒 Security Notes

- API keys are client-side (VITE_ prefix)
- For production, consider backend API proxy
- Rate limiting prevents excessive usage
- No sensitive data stored locally

## 🎨 Customization

### Adding New Thought Templates
Edit `src/utils/thoughtGenerator.ts` to add new templates.

### Modifying AI Prompts
Update `src/services/openaiService.js` prompt templates.

### Styling Changes
Uses Tailwind CSS - modify classes in components.

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
Set `VITE_OPENAI_API_KEY` in your deployment platform.

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
- Ensure key starts with 'sk-'
- Check OpenAI account billing
- Verify key permissions

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
- Quick setup (works without API keys)
- Cost-controlled AI usage
- Professional UI/UX
- Full feature set
- Easy customization

Perfect for demonstrating AI integration, React skills, and creative problem-solving!