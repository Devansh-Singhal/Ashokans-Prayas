# Pothole AI Detector - Standalone Stage Demo

A self-contained Expo application demonstrating real-time accelerometer and gyroscope pothole detection, including the **Stage Demo (Toss & Catch)** feature.

---

## Quick Start (Run on Any Computer)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Expo Development Server
```bash
npx expo start
```

---

## How to Test on Mobile (Physical Device)
1. Install **Expo Go** on your phone (iOS App Store or Google Play Store).
2. Scan the QR code shown in your terminal with your phone's camera (iOS) or Expo Go app (Android).
3. The app will open and immediately stream live data from your phone's physical accelerometer and gyroscope at 50 Hz.

### The Stage Toss & Catch Demo (No Buttons Needed!)
- Hold your phone in your hand.
- Toss it gently 1–2 feet up into the air and catch it.
- **In the air**: The physical accelerometer registers weightlessness (< 0.38g). The screen lights up purple: `✈️ AIRBORNE (FREEFALL)!` with a live millisecond airtime counter.
- **When caught**: The hand arrests the fall, creating a sharp upward deceleration spike (> 2.5g). The screen flashes red with haptic feedback:
  ```
  💥 POTHOLE DETECTED!
  CRITICAL IMPACT (+3.8g)
  Confidence: 98%
  ```

---

## How to Test on Desktop / Laptop Simulator
If you want to run it on your friend's laptop in a browser:
```bash
npx expo start --web
```
Use the interactive simulation controls to test:
- **`🚀 Toss & Catch (Stage Demo)`**: Simulates the airborne weightlessness and catch impact.
- **`💥 Road Pothole Strike`**: Simulates a vehicle wheel dropping into a pothole cavity.
- **`🚧 Speed Bump`**: Demonstrates speed bump rejection.
- **`🗑️ Clear Log`**: Resets the detection event feed.

---

## Architecture & Algorithm Highlights
- **Dynamic 3D Coordinate Realignment**: Projects acceleration onto Earth's true gravity vector ($\hat{u}_z$), neutralizing phone tilt or mount angle.
- **2nd-Order Butterworth Bandpass Filter (2.5 Hz – 24 Hz)**: Isolates road shock impulses from engine buzz and chassis roll.
- **Adaptive Welford Noise Baseline**: Automatically calibrates detection threshold to vehicle suspension stiffness.
- **Waveform Classifier**: Distinguishes dip-then-spike pothole waveforms from speed bumps and rumble strips.
