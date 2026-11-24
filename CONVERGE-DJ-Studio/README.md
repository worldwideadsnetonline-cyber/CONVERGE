# CONVERGE DJ Studio

Windows 10 x64 four-deck DJ workstation — evolving prototype (0.2.0).

## Current features
- Four local audio decks, loading MP3/WAV/FLAC/OGG/M4A/AAC.
- Transport: play/pause, stop, cue-point capture/preview, and four hot cues per deck.
- Four-channel EQ (high/mid/low), gain, master level and crossfader.
- Persistent local music library (stores file paths in the local app profile; original audio files are not copied).
- Audio decoding for peak waveform visualization and rough tempo estimation.
- Beat-loop lengths (1/2/4/8 beats), tempo control and rough BPM-based tempo matching.
- WebM recording of the app's master output.
- Basic MIDI input handling (starter mapping, not configurable MIDI Learn).
- Electron desktop shell and NSIS Windows installer.

## Release build
The GitHub Actions workflow builds a Windows x64 NSIS installer on pushes to the DJ branch and can be manually triggered. The workflow performs JavaScript syntax checks before packaging. Artifacts are downloadable from the workflow run.

## Important limitations
This is an early development build, not yet suitable for relying on professional live performances. BPM detection is approximate and may be wrong; BPM sync is not phase/beatgrid-accurate and tempo changes alter pitch. Beat loops are not quantized. The cue and hot-cue functions are basic. Waveform is a peak overview, not a detailed zoomable waveform. Headphone cue routing, ASIO/WASAPI selection, pitch-independent time-stretch, key detection, beatgrid editing, accurate phase sync, MIDI Learn, library metadata/search, audio stress tests, and Windows hardware validation are not yet implemented. Codec support depends on Electron/Chromium.
