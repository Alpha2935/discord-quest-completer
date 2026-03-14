<div align="center">
  <h1>🎮 Discord Quest Completer</h1>
  <p><strong>Automatically complete Discord quests seamlessly in the background!</strong></p>
</div>

---

### ✨ Features
- **🚀 Concurrent Questing**: Accept multiple quests at the same time, and this script will complete them **all at once** in the background!
- **🛡️ Undetected & Safe**: Mimics realistic client behavior directly from within your client. 
- **⚡ Auto-Resolution**: Automatically finds the necessary internal Discord modules, immune to property key updates.
- **💻 Desktop App Native**: Fully works within the standalone Discord Desktop app!

---

> [!NOTE]  
> This script is designed for the **[Discord Desktop App](https://discord.com/download)**. It relies on internal stores that are unavailable in the browser version for game-related quests.

> [!TIP]  
> Remember: You can accept **multiple quests** simultaneously before running the script. The script will automatically spoof and complete *all* accepted quests in parallel, saving you a ton of time!

---

## 🛠️ How to Use

1. **Accept Quests:** Go to your **Quests** tab in Discord and accept one or multiple quests.
2. **Open DevTools:** Press `Ctrl+Shift+I` to open the Developer Tools. *(If it doesn't open, see the FAQ below).*
3. **Navigate to Console:** Click on the **Console** tab at the top of the DevTools window.
4. **Paste and Execute:** Copy the code below, paste it into the console, and press `Enter`. *(If Discord warns you about pasting code, you may need to firmly type `allow pasting` and hit enter first!)*

<details>
<summary><b>🔥 Click here to expand the Quest Completer Code</b></summary>

```javascript
delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata).exports.A;
let RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames).exports.Ay;
let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest).exports.A;
let ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent).exports.A;
let GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel).exports.Ay;
let FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue).exports.h;
let api = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get).exports.Bo;

const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
let quests = [...QuestsStore.quests.values()].filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now() && supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y)))
let isApp = typeof DiscordNative !== "undefined"

if (quests.length === 0) {
    console.log("You don't have any uncompleted quests!")
} else {
    let doQuest = function (quest) {
        const pid = Math.floor(Math.random() * 30000) + 1000
        const applicationId = quest.config.application.id
        const applicationName = quest.config.application.name
        const questName = quest.config.messages.questName
        const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2
        const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null)
        const secondsNeeded = taskConfig.tasks[taskName].target
        let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0

        if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
            const maxFuture = 10, speed = 7, interval = 1
            const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime()
            let completed = false
            let fn = async () => {
                while (true) {
                    const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture
                    const diff = maxAllowed - secondsDone
                    const timestamp = secondsDone + speed
                    if (diff >= speed) {
                        const res = await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) } })
                        completed = res.body.completed_at != null
                        secondsDone = Math.min(secondsNeeded, timestamp)
                    }
                    if (timestamp >= secondsNeeded) break
                    await new Promise(resolve => setTimeout(resolve, interval * 1000))
                }
                if (!completed) {
                    await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } })
                }
                console.log(`[${questName}] Quest completed!`)
            }
            fn()
            console.log(`Spoofing video for ${questName}.`)

        } else if (taskName === "PLAY_ON_DESKTOP") {
            if (!isApp) {
                console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!")
            } else {
                api.get({ url: `/applications/public?application_ids=${applicationId}` }).then(res => {
                    const appData = res.body[0]
                    const exeName = appData.executables?.find(x => x.os === "win32")?.name?.replace(">", "") ?? appData.name.replace(/[\/\\:*?"<>|]/g, "")

                    const fakeGame = {
                        cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                        exeName,
                        exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                        hidden: false,
                        isLauncher: false,
                        id: applicationId,
                        name: appData.name,
                        pid: pid,
                        pidPath: [pid],
                        processName: appData.name,
                        start: Date.now(),
                    }
                    const realGames = RunningGameStore.getRunningGames()
                    const existingFakes = RunningGameStore.__fakeGames__ ?? []
                    existingFakes.push(fakeGame)
                    RunningGameStore.__fakeGames__ = existingFakes

                    const realGetRunningGames = RunningGameStore.__realGetRunningGames__ ?? RunningGameStore.getRunningGames
                    const realGetGameForPID = RunningGameStore.__realGetGameForPID__ ?? RunningGameStore.getGameForPID
                    RunningGameStore.__realGetRunningGames__ = realGetRunningGames
                    RunningGameStore.__realGetGameForPID__ = realGetGameForPID
                    RunningGameStore.getRunningGames = () => RunningGameStore.__fakeGames__
                    RunningGameStore.getGameForPID = (pid) => RunningGameStore.__fakeGames__.find(x => x.pid === pid)
                    FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: RunningGameStore.__fakeGames__ })

                    let fn = data => {
                        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value)
                        console.log(`[${questName}] Quest progress: ${progress}/${secondsNeeded}`)

                        if (progress >= secondsNeeded) {
                            console.log(`[${questName}] Quest completed!`)

                            RunningGameStore.__fakeGames__ = RunningGameStore.__fakeGames__.filter(x => x.pid !== fakeGame.pid)
                            if (RunningGameStore.__fakeGames__.length === 0) {
                                RunningGameStore.getRunningGames = RunningGameStore.__realGetRunningGames__
                                RunningGameStore.getGameForPID = RunningGameStore.__realGetGameForPID__
                                delete RunningGameStore.__fakeGames__
                                delete RunningGameStore.__realGetRunningGames__
                                delete RunningGameStore.__realGetGameForPID__
                            }
                            FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: RunningGameStore.__fakeGames__ ?? [] })
                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                        }
                    }
                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)

                    console.log(`Spoofed your game to ${applicationName}. Wait for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`)
                })
            }

        } else if (taskName === "STREAM_ON_DESKTOP") {
            if (!isApp) {
                console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!")
            } else {
                let realFunc = ApplicationStreamingStore.__realGetStreamerActiveStreamMetadata__ ?? ApplicationStreamingStore.getStreamerActiveStreamMetadata
                ApplicationStreamingStore.__realGetStreamerActiveStreamMetadata__ = realFunc
                ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                    id: applicationId,
                    pid,
                    sourceName: null
                })

                let fn = data => {
                    let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value)
                    console.log(`[${questName}] Quest progress: ${progress}/${secondsNeeded}`)

                    if (progress >= secondsNeeded) {
                        console.log(`[${questName}] Quest completed!`)
                        ApplicationStreamingStore.getStreamerActiveStreamMetadata = ApplicationStreamingStore.__realGetStreamerActiveStreamMetadata__
                        delete ApplicationStreamingStore.__realGetStreamerActiveStreamMetadata__
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
                    }
                }
                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)

                console.log(`Spoofed your stream to ${applicationName}. Stream any window in vc for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`)
                console.log("Remember that you need at least 1 other person to be in the vc!")
            }

        } else if (taskName === "PLAY_ACTIVITY") {
            const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id
            const streamKey = `call:${channelId}:1`

            let fn = async () => {
                console.log(`[${questName}] Starting quest...`)
                while (true) {
                    const res = await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: false } })
                    const progress = res.body.progress.PLAY_ACTIVITY.value
                    console.log(`[${questName}] Quest progress: ${progress}/${secondsNeeded}`)
                    if (progress >= secondsNeeded) {
                        await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: true } })
                        break
                    }
                    await new Promise(resolve => setTimeout(resolve, 20 * 1000))
                }
                console.log(`[${questName}] Quest completed!`)
            }
            fn()
        }
    }

    console.log(`Starting ${quests.length} quest(s) in parallel...`)
    for (const quest of quests) {
        doQuest(quest)
    }
}
```
</details>

## 🚦 What Happens Next?
Depending on your quests, the script will guide you:
- **Play/Watch Quests:** Sit back and relax. The script spoofs the game/video and completes it automatically.
- **Stream Quests:** Join a Voice Channel with at least one friend (or an alt account) and stream *any* window. The script handles the rest!

You can monitor the exact progress of each quest right there in the Console! Once it says **Quest completed!**, simply go to your Quests tab and claim your reward. 🎉

---

## ❓ FAQ & Troubleshooting

<details>
<summary><b>Nothing happens or Discord stops sending messages?</b></summary>
This is an occasional bug when opening DevTools where Discord's network requests freeze. Restart Discord completely and try again.
</details>

<details>
<summary><b>Can I be banned for using this?</b></summary>
There is always a theoretical risk with client modifications or scripts, but to date, users have not been banned for claiming quests this way. Use at your own discretion.
</details>

<details>
<summary><b><code>Ctrl+Shift+I</code> isn't doing anything!</b></summary>
Try downloading the <a href="https://discord.com/api/downloads/distributions/app/installers/latest?channel=ptb&platform=win&arch=x64">Discord PTB client</a>, which has DevTools enabled by default, or look up how to re-enable DevTools in your Discord config. Also ensure your GPU overlay (like AMD Radeon) isn't intercepting the shortcut.
</details>

<details>
<summary><b>It says "Requires desktop app" but I'm on Vesktop?</b></summary>
Vesktop is essentially a browser wrapper and doesn't have the deep desktop integration needed. Please use the official Desktop Client.
</details>

---
<div align="center">
  <p><i>Based on original concepts by aamiaa • Licensed under <a href="LICENSE">GPL-3.0</a></i></p>
</div>
