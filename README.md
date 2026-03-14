# Complete Discord Quests Automatically

> [!NOTE]
> This does not work in browser for quests which require you to play a game! Use the [desktop app](https://discord.com/download) to complete those.

> [!TIP]
> Unlike the [original script](https://gist.github.com/aamiaa/204cd9d42013ded9faf646fae7f89fbb), this version uses **dynamic module resolution** — it won't break when Discord updates their webpack export keys.

## How to use this script:

1. Accept a quest under the **Quests** tab (you can accept multiple quests at the same time and the script will automatically complete them all concurrently!)
2. Press `Ctrl+Shift+I` to open DevTools
3. Go to the **Console** tab
4. Paste the following code and hit enter:

<details>
<summary>Click to expand</summary>

```js
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

(If you're unable to paste into the console, you might have to type `allow pasting` and hit enter first)

5. Follow the printed instructions depending on what type of quest you have:
   - If your quest says to **play** the game or **watch a video**, you can just wait and do nothing
   - If your quest says to **stream** the game, join a VC with a friend or alt and stream any window

6. Wait for it to complete the quest. You can track progress by looking at the `[Quest] Progress:` prints in the Console tab, or by looking at the progress bar in the Quests tab.

7. You can now claim the reward! 🎉

## What's different from the original?

The [original script by aamiaa](https://gist.github.com/aamiaa/204cd9d42013ded9faf646fae7f89fbb) uses hardcoded webpack export keys (`.Z`, `.A`, `.Bo`, etc.) that **break every Discord update**. This version uses **dynamic module resolution** — it searches all exports by method names instead of key names, so it survives updates automatically.

## FAQ

**Q: Running the script does nothing besides printing "undefined", and makes chat messages not go through**
A: This is a random bug with opening DevTools, where all HTTP requests break for a few minutes. It's not the script's fault. Either wait and try again, or restart Discord and try again.

**Q: Can I get banned for using this?**
A: There is always a risk, though so far nobody has been banned for this or other similar things like client mods.

**Q: `Ctrl+Shift+I` doesn't work**
A: Either download the [PTB client](https://discord.com/api/downloads/distributions/app/installers/latest?channel=ptb&platform=win&arch=x64), or use [this](https://www.reddit.com/r/discordapp/comments/sc61n3/comment/hu4fw5x/) to enable DevTools on Stable.

**Q: `Ctrl+Shift+I` takes a screenshot**
A: Disable the keybind in your AMD Radeon app.

**Q: I get a syntax error / unexpected token error**
A: Make sure your browser isn't auto-translating this website before copying the script. Turn off any translator extensions and try again.

**Q: I'm on Vesktop but it tells me I'm using a browser**
A: Vesktop is not a true desktop client, it's a fancy browser wrapper. Download the actual [desktop app](https://discord.com/download) instead.

**Q: I get "Module resolution failed"**
A: Discord may have renamed internal methods. Open an [issue](../../issues) with the error details.

**Q: Can I complete expired quests with this?**
A: No, there is no way to do that.

## License (GPL-3.0)

Based on the [original work by aamiaa](https://gist.github.com/aamiaa/204cd9d42013ded9faf646fae7f89fbb). Licensed under [GPL-3.0](LICENSE).
