# CONVERGE DJ Studio

Windows 10 x64 four-deck DJ workstation — active development build (0.3.7).

## Current features
- Four local audio decks, loading MP3/WAV/FLAC/OGG/M4A/AAC.
- Transport: play/pause, stop, cue-point capture/preview, and four hot cues per deck.
- Four-channel EQ (high/mid/low), gain, master level and crossfader.
- Persistent local music library (stores file paths in the local app profile; original audio files are not copied).
- Audio decoding for peak waveform visualization and rough tempo estimation.
- Beat-loop lengths (1/2/4/8 beats), tempo control and rough BPM-based tempo matching.
- WebM recording of the app's master output.
- MIDI note mapping for transport buttons and MIDI CC Learn for sliders (right-click a control; support depends on controller messages).
- Electron desktop shell and NSIS Windows installer.

## Release build
The GitHub Actions workflow builds a Windows x64 NSIS installer on pushes to the DJ branch and can be manually triggered. The workflow performs JavaScript syntax checks before packaging. Artifacts are downloadable from the workflow run.

## Known limitations and safety for live use
This is an early development build, not yet suitable for relying on professional live performances. BPM detection is approximate and may be wrong; BPM sync is not phase/beatgrid-accurate and tempo changes alter pitch. Beat loops are not quantized. The cue and hot-cue functions are basic. Waveform is a peak overview, not a detailed zoomable waveform. Headphone cue routing, ASIO/WASAPI selection, pitch-independent time-stretch, key detection, beatgrid editing, accurate phase sync, advanced MIDI routing, full metadata/tag editing, audio stress tests, and Windows hardware validation are not yet implemented. The current installer passes automated syntax and packaging checks, but has not been verified against physical Windows audio hardware. Codec support depends on Electron/Chromium.
