<p align="center">
  <img src="https://img.shields.io/badge/Discord-Quest_Completer-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord Quest Completer"/>
</p>

<h1 align="center">⚡ Discord Quest Completer</h1>

<p align="center">
  <b>Auto-complete Discord quests and earn Orbs — no game install needed.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-working-brightgreen?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/update--proof-yes-blue?style=flat-square" alt="Update Proof"/>
  <img src="https://img.shields.io/badge/license-GPL--3.0-orange?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/quests-all_types-purple?style=flat-square" alt="Quest Types"/>
</p>

---

## 🎯 What It Does

Paste a single script in Discord's DevTools console → all your enrolled quests auto-complete.

| Quest Type | How It Works | Browser? |
|---|---|---|
| 🎬 **Watch Video** | Spoofs video progress timestamps | ✅ Yes |
| 📱 **Watch Video (Mobile)** | Same as above | ✅ Yes |
| 🎮 **Play Game** | Fakes a running game process | ❌ Desktop only |
| 📡 **Stream Game** | Spoofs stream metadata in VC | ❌ Desktop only |
| 🕹️ **Play Activity** | Sends fake heartbeats | ✅ Yes |

## 🚀 How to Use

### Step 1 — Accept the Quest
Go to **User Settings → Quests** and accept any available quest.

### Step 2 — Open DevTools
Press `Ctrl + Shift + I` in Discord to open DevTools.

> **Can't open DevTools?** Use the [PTB client](https://discord.com/api/downloads/distributions/app/installers/latest?channel=ptb&platform=win&arch=x64) or see [how to enable DevTools on Stable](https://www.reddit.com/r/discordapp/comments/sc61n3/comment/hu4fw5x/).

### Step 3 — Paste & Run
Go to the **Console** tab, paste the contents of [`quest_completer.js`](quest_completer.js), and press **Enter**.

> If you can't paste, type `allow pasting` first and hit Enter.

### Step 4 — Wait
- **Video quests** → Done in seconds ⚡
- **Play/Stream quests** → ~15 min, just leave Discord open
- **Stream quests** → You must be in a VC with at least 1 other person

### Step 5 — Claim Reward
Once you see `Quest completed!` in Console, go claim your reward! 🎉

---

## 🛡️ Why This Fork?

The [original script by aamiaa](https://gist.github.com/aamiaa/204cd9d42013ded9faf646fae7f89fbb) hardcodes Discord's internal webpack export keys (`.Z`, `.ZP`, `.A`, `.Ay`, `.Bo`, `.tn`). Every Discord update changes these keys, breaking the script.

**This version is update-proof:**

| Feature | Original | This Version |
|---|---|---|
| Module resolution | Hardcoded keys (`.Z`, `.Bo`...) | Dynamic prototype-based search |
| Breaks on Discord update? | ✅ Frequently | ❌ Rarely |
| API module detection | Single key lookup | Smart filtering + validation |
| PLAY_ON_DESKTOP | Needs extra API call | Works directly from quest config |
| Error handling | Minimal | Full validation + graceful fallbacks |
| i18n module conflicts | Not handled | Filtered out automatically |

### How the Update-Proof Resolution Works

Instead of:
```js
// ❌ Breaks every update
Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest).exports.Z
```

We use:
```js
// ✅ Works across updates
findByProtoProps('getQuest') // searches ALL export keys automatically
```

---

## 📋 Supported Quest Types

### 🎬 WATCH_VIDEO
Posts spoofed timestamps to `/quests/{id}/video-progress`. Completes in seconds.

### 🎮 PLAY_ON_DESKTOP
Injects a fake game process into `RunningGameStore` and dispatches `RUNNING_GAMES_CHANGE`. Discord's heartbeat system does the rest. Takes ~15 min.

### 📡 STREAM_ON_DESKTOP  
Overrides `ApplicationStreamingStore.getStreamerActiveStreamMetadata` to return fake stream data. Requires being in a VC with 1+ person.

### 🕹️ PLAY_ACTIVITY
Sends periodic heartbeat POST requests with a spoofed `stream_key`.

---

## ❓ FAQ

**Q: Can I get banned?**  
A: There's always a risk, but nobody has been banned for this so far.

**Q: Script prints "undefined" and nothing happens**  
A: This is a Discord DevTools bug where HTTP requests break temporarily. Restart Discord and try again.

**Q: Ctrl+Shift+I doesn't work**  
A: Use the [PTB client](https://discord.com/api/downloads/distributions/app/installers/latest?channel=ptb&platform=win&arch=x64) or [enable DevTools on Stable](https://www.reddit.com/r/discordapp/comments/sc61n3/comment/hu4fw5x/).

**Q: Ctrl+Shift+I takes a screenshot**  
A: Disable the keybind in your AMD Radeon app settings.

**Q: I get a syntax error**  
A: Make sure your browser isn't auto-translating this page before copying.

**Q: Can I complete expired quests?**  
A: No, there's no way to do that.

**Q: Works on Vesktop?**  
A: Vesktop is a browser wrapper, not a true desktop client. Game/stream quests won't work. Use the real Discord app.

**Q: Module resolution failed error?**  
A: Discord may have renamed internal methods. Open an issue with the error details.

---

## ⚠️ Disclaimer

This script is for **educational purposes only**. Use at your own risk. The authors are not responsible for any consequences of using this script, including but not limited to account restrictions.

---

## 📜 License

[GPL-3.0](LICENSE) — Based on the original work by [aamiaa](https://gist.github.com/aamiaa/204cd9d42013ded9faf646fae7f89fbb).
