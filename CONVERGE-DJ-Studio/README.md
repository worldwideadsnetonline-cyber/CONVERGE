# CONVERGE DJ Studio

Advanced four-deck Windows DJ workstation (Electron prototype).

## Current prototype
The first source package contains a four-deck desktop UI, local audio-file loading, per-deck transport and tempo controls, 3-band EQ, master gain, crossfader, basic hot cues, basic loop control, recording, and starter Web MIDI input.

## Build
On Windows 10/11 x64 with Node.js 20+:
```powershell
npm install
npm run dist:win
```
The NSIS installer is generated in `dist/CONVERGE-DJ-Studio-Setup-0.1.0.exe`.

## Important status
This is an early functional prototype, not yet a club-ready DJ system. Planned engineering includes accurate BPM/key analysis, beatgrids and quantized sync, pitch-preserving time stretch, decoded waveforms, low-latency audio device routing, independent headphone cue output, and tested MIDI mapping profiles.

See the downloadable source archive shared in the ChatGPT conversation for the current complete 0.1.0 source tree.
