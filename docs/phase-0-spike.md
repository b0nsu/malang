# Phase 0 technical spike

The project is configured for Expo development builds, not Expo Go. `react-native-filament` is installed as the native renderer candidate; validate it with `npx expo prebuild` followed by an iOS and Android development build before integrating a production GLB.

`expo-sqlite` is configured with its SQLCipher build flag (`useSQLCipher: true`). On first open, a 256-bit random key is generated and stored only in SecureStore, then applied before schema creation; WAL and foreign keys are enabled. Key-loss recovery must be tested on physical devices before release.

`assets/models/malang-neutral-v1.glb` is loaded through `FilamentScene` in the native sculpt screen. `face-mapper.ts` is the stable morph-name boundary. The remaining device-soak and snapshot checks are explicit release gates.
