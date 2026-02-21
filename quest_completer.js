delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

function findByProtoProps(...props) {
    for (const m of Object.values(wpRequire.c)) {
        if (!m?.exports) continue;
        for (const key of Object.keys(m.exports)) {
            if (key === '__esModule') continue;
            try {
                const exp = m.exports[key];
                if (exp && (typeof exp === 'object' || typeof exp === 'function')) {
                    const proto = exp.__proto__ ?? exp.prototype;
                    if (proto && props.every(p => typeof proto[p] === 'function')) return exp;
                }
            } catch (e) { }
        }
    }
    return null;
}

function findByDirectProps(...props) {
    for (const m of Object.values(wpRequire.c)) {
        if (!m?.exports) continue;
        for (const key of Object.keys(m.exports)) {
            if (key === '__esModule') continue;
            try {
                const exp = m.exports[key];
                if (exp && typeof exp === 'object' && props.every(p => typeof exp[p] === 'function')) return exp;
            } catch (e) { }
        }
    }
    return null;
}

let ApplicationStreamingStore = findByProtoProps('getStreamerActiveStreamMetadata');
let RunningGameStore = findByDirectProps('getRunningGames', 'getGameForPID');
let QuestsStore = findByProtoProps('getQuest');
let ChannelStore = findByProtoProps('getAllThreadsForParent', 'getSortedPrivateChannels');
let GuildChannelStore = findByDirectProps('getSFWDefaultChannel', 'getAllGuilds');
let FluxDispatcher = findByProtoProps('flushWaitQueue', 'subscribe', 'dispatch');

let api = (() => {
    for (const m of Object.values(wpRequire.c)) {
        if (!m?.exports) continue;
        for (const key of Object.keys(m.exports)) {
            if (key === '__esModule') continue;
            try {
                const exp = m.exports[key];
                if (!exp || typeof exp !== 'object') continue;
                if (typeof exp.get !== 'function' || typeof exp.post !== 'function') continue;
                if (typeof exp.put !== 'function' || typeof exp.patch !== 'function') continue;
                if (exp.Messages !== undefined || typeof exp.getLocale === 'function') continue;
                if (typeof exp.getAPIBaseURL === 'function' || typeof exp.del === 'function' || typeof exp.delete === 'function') return exp;
                const r = exp.get({ url: '/users/@me' });
                if (r && typeof r.then === 'function') { r.catch(() => { }); return exp; }
            } catch (e) { }
        }
    }
    return null;
})();

const modules = { ApplicationStreamingStore, RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api };
const missing = Object.entries(modules).filter(([, v]) => !v).map(([k]) => k);
if (missing.length > 0) {
    console.error(`%c[Quest Completer] Failed to find modules: ${missing.join(', ')}`, 'color:#ff4444;font-weight:bold');
    throw new Error('Module resolution failed');
}
console.log('%c[Quest Completer] All modules loaded ✓', 'color:#44ff44;font-weight:bold');

const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];

let quests = [...QuestsStore.quests.values()].filter(x =>
    x.userStatus?.enrolledAt && !x.userStatus?.completedAt &&
    new Date(x.config.expiresAt).getTime() > Date.now()
).filter(x => {
    const tc = x.config.taskConfig ?? x.config.taskConfigV2;
    return tc?.tasks && supportedTasks.some(t => Object.keys(tc.tasks).includes(t));
});

let isApp = typeof DiscordNative !== "undefined";

if (quests.length === 0) {
    console.log('%c[Quest Completer] No uncompleted quests found.', 'color:#ffaa00;font-weight:bold');
} else {
    console.log(`%c[Quest Completer] Found ${quests.length} quest(s)`, 'color:#44ff44;font-weight:bold');

    let doJob = function () {
        const quest = quests.pop();
        if (!quest) { console.log('%c[Quest Completer] All done! 🎉', 'color:#44ff44;font-weight:bold'); return; }

        const pid = Math.floor(Math.random() * 30000) + 1000;
        const applicationId = quest.config.application.id;
        const applicationName = quest.config.application.name;
        const questName = quest.config.messages.questName;
        const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
        const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null);
        const secondsNeeded = taskConfig.tasks[taskName].target;
        let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

        console.log(`%c[Quest] ${questName} — ${taskName} — ${secondsDone}/${secondsNeeded}s`, 'color:#aa88ff;font-weight:bold');

        if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
            const maxFuture = 10, speed = 7, interval = 1;
            const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
            let completed = false;
            (async () => {
                while (true) {
                    const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;
                    const diff = maxAllowed - secondsDone;
                    const timestamp = secondsDone + speed;
                    if (diff >= speed) {
                        try {
                            const res = await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) } });
                            completed = res.body?.completed_at != null;
                            secondsDone = Math.min(secondsNeeded, timestamp);
                        } catch (e) { }
                    }
                    if (timestamp >= secondsNeeded) break;
                    await new Promise(r => setTimeout(r, interval * 1000));
                }
                if (!completed) await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } });
                console.log(`%c[Quest] ✓ ${questName} completed!`, 'color:#44ff44;font-weight:bold');
                doJob();
            })();
            console.log(`[Quest] Spoofing video for "${questName}"...`);

        } else if (taskName === "PLAY_ON_DESKTOP") {
            if (!isApp) {
                console.log(`%c[Quest] ✗ ${questName} requires the desktop app!`, 'color:#ff4444;font-weight:bold');
                doJob(); return;
            }
            const exeName = applicationName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.exe';
            const fakeGame = {
                cmdLine: `C:\\Program Files\\${applicationName}\\${exeName}`, exeName,
                exePath: `c:/program files/${applicationName.toLowerCase()}/${exeName}`,
                hidden: false, isLauncher: false, id: applicationId, name: applicationName,
                pid, pidPath: [pid], processName: applicationName, start: Date.now(),
            };
            const realGames = RunningGameStore.getRunningGames();
            const fakeGames = [fakeGame];
            const realGetRunningGames = RunningGameStore.getRunningGames;
            const realGetGameForPID = RunningGameStore.getGameForPID;
            RunningGameStore.getRunningGames = () => fakeGames;
            RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid);
            FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames });
            let fn = data => {
                let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                console.log(`[Quest] Progress: ${progress}/${secondsNeeded}s`);
                if (progress >= secondsNeeded) {
                    console.log(`%c[Quest] ✓ ${questName} completed!`, 'color:#44ff44;font-weight:bold');
                    RunningGameStore.getRunningGames = realGetRunningGames;
                    RunningGameStore.getGameForPID = realGetGameForPID;
                    FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] });
                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                    doJob();
                }
            };
            FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
            console.log(`[Quest] Spoofed game: ${applicationName} — wait ~${Math.ceil((secondsNeeded - secondsDone) / 60)} min`);

        } else if (taskName === "STREAM_ON_DESKTOP") {
            if (!isApp) {
                console.log(`%c[Quest] ✗ ${questName} requires the desktop app!`, 'color:#ff4444;font-weight:bold');
                doJob(); return;
            }
            let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
            ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({ id: applicationId, pid, sourceName: null });
            let fn = data => {
                let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                console.log(`[Quest] Progress: ${progress}/${secondsNeeded}s`);
                if (progress >= secondsNeeded) {
                    console.log(`%c[Quest] ✓ ${questName} completed!`, 'color:#44ff44;font-weight:bold');
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                    doJob();
                }
            };
            FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
            console.log(`[Quest] Spoofed stream: ${applicationName} — stream any window in VC for ~${Math.ceil((secondsNeeded - secondsDone) / 60)} min`);
            console.log('[Quest] ⚠ You need at least 1 other person in the VC!');

        } else if (taskName === "PLAY_ACTIVITY") {
            const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL?.length > 0)?.VOCAL[0]?.channel?.id;
            if (!channelId) { console.error('[Quest] No valid channel found for activity.'); doJob(); return; }
            const streamKey = `call:${channelId}:1`;
            (async () => {
                while (true) {
                    try {
                        const res = await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: false } });
                        const progress = res.body.progress.PLAY_ACTIVITY.value;
                        console.log(`[Quest] Progress: ${progress}/${secondsNeeded}s`);
                        if (progress >= secondsNeeded) {
                            await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: true } });
                            break;
                        }
                    } catch (e) { }
                    await new Promise(r => setTimeout(r, 20 * 1000));
                }
                console.log(`%c[Quest] ✓ ${questName} completed!`, 'color:#44ff44;font-weight:bold');
                doJob();
            })();
        }
    };
    doJob();
}
