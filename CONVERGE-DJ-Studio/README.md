# CONVERGE DJ Studio

Windows 10 x64 four-deck DJ workstation prototype.

## Implemented in the current source
- Four independent audio decks with local-file loading (MP3/WAV/FLAC/OGG/M4A/AAC)
- Play, pause, stop, cue, tempo adjustment, hot cues and basic beat loops
- Four-channel EQ (high/mid/low), channel gain, master level and crossfader
- Music library and one-click loading to any deck
- Master output recording to WebM
- Basic Web MIDI input detection and starter note mapping
- Decoded audio peak waveforms and approximate automatic BPM estimation from onset-energy autocorrelation
- BPM-ratio tempo matching between decks (playback-rate based; pitch changes with tempo)
- Electron desktop shell and Windows NSIS installer configuration

## Build the Windows installer
Requires Node.js 20+ on Windows 10/11 x64:
1. Extract this project.
2. Open a terminal in the project folder.
3. Run `npm install`
4. Run `npm run dist:win`
5. Installer is written to `dist/CONVERGE-DJ-Studio-Setup-0.1.0.exe`.

GitHub Actions workflow: `.github/workflows/converge-dj-windows.yml`. It is configured to build on updates to the DJ branch and supports manual dispatch when the workflow is available in the repository's default branch.

## Known limitations
This remains a development prototype, not a club-certified DJ engine. BPM estimation is approximate and can fail on ambient, sparse, syncopated or heavily processed material. Waveforms are decoded peak summaries, not spectral waveforms. Sync matches estimated BPM using playback rate and therefore changes pitch; it is not phase-accurate beatgrid sync. Key detection, pitch-independent time-stretch, beatgrid/phase alignment, ASIO/WASAPI device selection, independent headphone cue routing, configurable MIDI learn/mappings, and hardware validation remain outstanding. Audio codec support depends on Chromium.
