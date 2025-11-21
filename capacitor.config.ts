import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.cineamateur.seven',
  appName: 'Seven Cineamateur',
  webDir: 'dist',
  server: {
    // En producción, apuntar a tu dominio de Vercel
    // url: 'https://your-vercel-domain.vercel.app',
    // cleartext: true
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: true,
      spinnerColor: '#e94560'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
}

export default config
