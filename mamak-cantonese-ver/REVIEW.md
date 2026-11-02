# Review — Kalau Mamak Tiba-Tiba Hilang, EP 01

## Creative calls
- Built straight from the approved storyboard (9 shots), tightened from 75 s to 60 s for vertical pacing.
- No voiceover: no TTS or HeyGen on this machine. Bold BM on-screen text carries the story so it works muted.
- No music bed: no music source available. Leave room for a trending platform sound at upload.
- Flat cut-vector look, no stock photos. People appear only as drinks and window silhouettes (3R safe).
- Registry: the particle-text-dissolve and count-up/slot ideas were used as reference, then rebuilt inline
  (the nested particle block did not take its variables inside a scene). Grain is the registry grain-overlay,
  stepped on the timeline instead of a CSS loop.

## Measured vs looked at
- `check`: passes. Kept warnings: the result reel numbers flash on purpose (slot roll); "DAY 1" reads as one word;
  three short SFX overlap on shared lanes (intended layering); one contrast note on the Milo shot after recolouring.
- Looked at: every scene start/middle, all 8 cuts, the hook, chat result, café price, third-place diagram.
- Sound: 44 bundled SFX placed peak +1 frame after picture. Measured, not heard.

## Weakest shot
- Shot 7 (table) opens on a plain white frame for ~0.3 s while the camera pulls out of the table top.
  With more time: add the steel table rim at the frame edge so the zoom reads from frame one.

## Voiceover (added)
- Microsoft neural TTS, voice ms-MY-OsmanNeural, via msedge-tts@2.1.0 (tool kept outside the project at M:\tts-tool).
  Raw clips in assets/vo, tightened clips (pauses 0.25 s, tempo up to 1.1x, -16 LUFS) in assets/vo/tight.
- Film stretched 60 s -> 68.3 s: scenes 5-9 lengthened and their animations re-timed to the spoken words;
  the table scene pulses each drink as it is named.
- Final mix normalised to -15.2 LUFS, true peak -1.5 dB (renders/kalau-mamak-hilang-ep01-final.mp4). Measured, not heard.

## Notes for next turn
- Long Windows path breaks snapshots/render: work through `subst M:` on the session folder.
