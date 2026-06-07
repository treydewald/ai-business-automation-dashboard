# Automation Dashboard Mobile App

Mobile application for viewing and managing workflows on iOS and Android.

## Features

- View list of workflows
- View workflow details and execution history
- Trigger workflow execution
- Monitor execution status and logs in real-time
- Push notifications for execution completion
- Offline support with local caching
- User authentication

## Setup

### Prerequisites

- Node.js 16+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (for iOS development)
- Android: Android Studio and Android SDK (for Android development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Update `.env` with your API base URL and project ID.

3. Start the development server:
```bash
npm start
```

### Development

#### Run on iOS Simulator
```bash
npm run ios
```

#### Run on Android Emulator
```bash
npm run android
```

#### Run on Web (for testing)
```bash
npm run web
```

### Building for Production

#### iOS
```bash
eas build --platform ios
```

#### Android
```bash
eas build --platform android
```

## Project Structure

```
src/
├── screens/          # App screens/pages
│   ├── auth/        # Login screen
│   ├── workflows/   # Workflow list and detail
│   └── executions/  # Execution detail and logs
├── services/        # API and utility services
│   ├── api.ts       # API client
│   ├── cache.ts     # Offline caching
│   └── notifications.ts  # Push notifications
├── store/           # State management (Zustand)
└── App.tsx          # Main app component
```

## API Integration

The app communicates with the backend API at the configured `EXPO_PUBLIC_API_URL`. Ensure the backend is running and accessible.

### Required Endpoints

- `POST /auth/login` - User authentication
- `GET /workflows` - List workflows
- `GET /workflows/{id}` - Get workflow details
- `POST /workflows/{id}/run` - Execute workflow
- `GET /executions` - List executions
- `GET /executions/{id}` - Get execution details
- `GET /executions/{id}/logs` - Get execution logs

## Push Notifications

To enable push notifications:

1. Configure your Expo project ID in `.env`
2. Ensure backend sends notifications to the device token
3. Users will receive notifications on:
   - Workflow execution completion
   - Workflow execution failure

## Testing

Run tests with:
```bash
npm test
```

## Troubleshooting

### Connection Issues
- Ensure backend API is running
- Check `EXPO_PUBLIC_API_URL` in `.env`
- Verify network connectivity

### Build Issues
- Clear cache: `expo cache clean`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Update Expo: `expo update`

## Contributing

Follow the existing code style and component patterns. Ensure all screens are responsive and work on both iOS and Android.

## License

Same as main project
