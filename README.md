> [!CAUTION]
> # 🛑 EXTREME WARNING: READ BEFORE USE 🛑
> 
> **Some users have received the following system message:**
> 
> <div align="center">
>   <img src="https://i.imgur.com/YourImageLinkHere.png" alt="Quest Access Suspended" width="600">
>   <p><em>"Hey, we continue to notice unusual Quest activity on your account... Your access to Quests has been suspended until [Date]."</em></p>
> </div>
> 
> **There isn't much I can do to make the script undetected, so use it at your own risk, as you WILL get flagged by doing so.**
> 
> Discord's anti-cheat systems are continuously monitoring for unusual patterns. While this script mimics realistic client behavior to stay under the radar, it is a violation of Discord's Inauthentic Engagement policy. If you value your account's ability to earn future quest rewards, **do not use this tool**. 

---

# 🎮 Discord Quest Completer

**Automatically complete Discord quests seamlessly in the background!**

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/GPL-3.0)

### ✨ Features

*   **🚀 Concurrent Questing:** Accept multiple quests at the same time, and this script will complete them **all at once** in parallel! No more waiting for one quest to finish before starting the next.
*   **🛡️ Update-Proof:** Dynamically resolves Discord's internal Webpack modules. It won't break just because Discord shuffles a property key.
*   **💻 Desktop App Native:** Fully optimized for the standalone Discord Desktop app. 
*   **⚡ Auto-Resolution:** Automatically finds the necessary internal stores, meaning less manual maintenance for you.

> **Note:** This script is designed for the **Discord Desktop App**. It relies on internal stores that are unavailable in the browser version for game-related quests. Vesktop and browser wrappers will not work for `PLAY_ON_DESKTOP` or `STREAM_ON_DESKTOP` tasks.

---

## 🛠️ How to Use

1.  **Accept Quests:** Go to your **Quests** tab in Discord and accept one or multiple quests. *(You can accept all available quests at once!)*
2.  **Open DevTools:** Press `Ctrl+Shift+I` to open the Developer Tools. 
    *(If it doesn't open, see the FAQ below).*
3.  **Navigate to Console:** Click on the **Console** tab at the top of the DevTools window.
4.  **Paste and Execute:** Copy the code block below, paste it into the console, and press `Enter`. 
    *(If Discord warns you about pasting code, you may need to firmly type `allow pasting` and hit enter first!)*

<details>
<summary><strong>🔥 Click here to expand the Quest Completer Code</strong></summary>

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

const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
let quests = [...QuestsStore.quests.values()].filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now() && supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y)));
let isApp = typeof DiscordNative !== "undefined";

if (quests.length === 0) {
    console.log("You don't have any uncompleted quests!");
} else {
    console.log(`Starting ${quests.length} quest(s) in parallel...`);

    // Parallel execution of all accepted quests
    quests.forEach(quest => {
        try {
            const pid = Math.floor(Math.random() * 30000) + 1000;
            const questName = quest.config.messages.questName;
            const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
            const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
            const taskData = taskConfig.tasks[taskName];

            // Safely extract application ID
            const applicationId = quest.config.application?.id ?? taskData.applications?.[0]?.id;
            const secondsNeeded = taskData.target;
            let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

            if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
                const speed = 7;
                const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
                let completed = false;
                let fn = async () => {            
                    while (true) {
                        const remaining = Math.min(speed, secondsNeeded - secondsDone);
                        await new Promise(resolve => setTimeout(resolve, remaining * 1000));

                        const timestamp = secondsDone + speed;
                        const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}});
                        completed = res.body?.completed_at != null;
                        secondsDone = Math.min(secondsNeeded, timestamp);

                        if (timestamp >= secondsNeeded) {
                            break;
                        }
                    }
                    if (!completed) {
                        await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}});
                    }
                    console.log(`[${questName}] Quest completed!`);
                };
                fn().catch(e => console.log(`[${questName}] Video error:`, e?.message || e));
                console.log(`Spoofing video for ${questName}.`);

            } else if (taskName === "PLAY_ON_DESKTOP") {
                if (!isApp) {
                    console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!");
                } else {
                    api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
                        const appData = res.body?.[0];
                        if (!appData) return console.log(`[${questName}] Failed to fetch app data.`);

                        const exeName = appData.executables?.find(x => x.os === "win32")?.name?.replace(">", "") ?? appData.name.replace(/[\/\\:*?"<>|]/g, "");

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
                        };

                        const realGames = RunningGameStore.getRunningGames();
                        const fakeGames = [fakeGame];
                        const realGetRunningGames = RunningGameStore.getRunningGames;
                        const realGetGameForPID = RunningGameStore.getGameForPID;

                        RunningGameStore.getRunningGames = () => fakeGames;
                        RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid);
                        FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames});

                        let fn = data => {
                            if (data.questId !== quest.id) return;
                            let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                            console.log(`[${questName}] Quest progress: ${progress}/${secondsNeeded}`);

                            if (progress >= secondsNeeded) {
                                console.log(`[${questName}] Quest completed!`);
                                RunningGameStore.getRunningGames = realGetRunningGames;
                                RunningGameStore.getGameForPID = realGetGameForPID;
                                FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []});
                                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                            }
                        };
                        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                        console.log(`Spoofed your game to ${appData.name}. Wait for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`);
                    }).catch(e => console.log(`[${questName}] Desktop error:`, e?.message || e));
                }

            } else if (taskName === "STREAM_ON_DESKTOP") {
                if (!isApp) {
                    console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!");
                } else {
                    let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                        id: applicationId,
                        pid,
                        sourceName: null
                    });

                    let fn = data => {
                        if (data.questId !== quest.id) return;
                        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                        console.log(`[${questName}] Quest progress: ${progress}/${secondsNeeded}`);

                        if (progress >= secondsNeeded) {
                            console.log(`[${questName}] Quest completed!`);
                            ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                        }
                    };
                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);

                    console.log(`Spoofed your stream to the target game. Stream any window in vc for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`);
                    console.log("Remember that you need at least 1 other person to be in the vc!");
                }

            } else if (taskName === "PLAY_ACTIVITY") {
                let channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0)?.VOCAL[0]?.channel.id;
                if (!channelId) return console.log(`[${questName}] Could not find a voice channel.`);

                const streamKey = `call:${channelId}:1`;

                let fn = async () => {
                    console.log(`[${questName}] Starting quest...`);
                    while (true) {
                        const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}});
                        const progress = res.body?.progress?.PLAY_ACTIVITY?.value ?? 0;
                        console.log(`[${questName}] Quest progress: ${progress}/${secondsNeeded}`);

                        if (progress >= secondsNeeded) {
                            await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}});
                            break;
                        }
                        await new Promise(resolve => setTimeout(resolve, 20 * 1000));
                    }
                    console.log(`[${questName}] Quest completed!`);
                };
                fn().catch(e => console.log(`[${questName}] Activity error:`, e?.message || e));
            }
        } catch (e) {
            console.log(`Error processing quest:`, e?.message || e);
        }
    });
}
