const fs = require('fs');
let content = fs.readFileSync('src/store/useAppStore.ts', 'utf8');

// 1. Imports
content = content.replace(/import \{ celebrate \} from "\@\/lib\/dopamineFeedback";\r?\n/, '');

// 2. Types
content = content.replace(/export type ThemeMode = "light" \| "dark";\r?\n/, '');
content = content.replace(/export type SprintStatus = "planning" \| "active" \| "completed" \| "cancelled";\r?\n/, '');

// 3. Interfaces
content = content.replace(/export interface HyperfocusSession \{[\s\S]*?\}\r?\n\r?\n/, '');
content = content.replace(/export interface Sprint \{[\s\S]*?\}\r?\n\r?\n/, '');
content = content.replace(/type: "success" \| "error" \| "info" \| "xp" \| "achievement" \| "boss";/, 'type: "success" | "error" | "info";');

// 4. AppState sections to remove
// Theme
content = content.replace(/  \/\/ ── Theme ──[\s\S]*?toggleTheme: \(\) => void;\r?\n\r?\n/, '');
// Gamification
content = content.replace(/  \/\/ ── Gamification ──[\s\S]*?checkAndResetStreak: \(\) => void;\r?\n\r?\n/, '');
// Hyperfocus
content = content.replace(/  \/\/ ── Hyperfocus Sessions ──[\s\S]*?addHyperfocusSession: \(session: Omit<HyperfocusSession, "id">\) => void;\r?\n\r?\n/, '');
// Boutique
content = content.replace(/  \/\/ ── Boutique ──[\s\S]*?buyReward: \(rewardId: string, cost: number\) => void;\r?\n\r?\n/, '');
// Sprints
content = content.replace(/  \/\/ ── Sprints ──[\s\S]*?assignTaskToSprint: \(taskId: string, sprintId: string \| undefined\) => void;\r?\n\r?\n/, '');

// 5. Settings AppState
content = content.replace(/  settings: \{[\s\S]*?\};\r?\n/, '  settings: {\n    enableSounds: boolean;\n  };\n');

// 6. Helpers
content = content.replace(/const BOSS_DMG_NORMAL[\s\S]*?const CRITICAL_RATE     = 0\.15;\r?\n\r?\n/, '');

// 7. Store Implementation: Theme
content = content.replace(/      \/\/ ── Theme ──[\s\S]*?toggleTheme: \(\) => set\(\(s\) => \(\{ theme: s\.theme === "light" \? "dark" : "light" \}\)\),\r?\n\r?\n/, '');

// 8. completeTask
const completeTaskOld = /      completeTask: \(id\) => \{[\s\S]*?      \},/g;
const completeTaskNew = `      completeTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: "done", completedAt: Date.now() } : t
          ),
          lastActiveAt: Date.now(),
        }));
      },`;
content = content.replace(completeTaskOld, completeTaskNew);

// 9. Store Implementation: sections to remove
content = content.replace(/      \/\/ ── Hyperfocus Sessions ──[\s\S]*?totalFocusMinutes: s\.totalFocusMinutes \+ session\.durationMinutes,\r?\n        \}\)\),\r?\n\r?\n/, '');
content = content.replace(/      \/\/ ── Boutique ──[\s\S]*?celebrate\("purchase"\);\r?\n      \},\r?\n\r?\n/, '');
content = content.replace(/      \/\/ ── Sprints ──[\s\S]*?t\.id === taskId \? \{ \.\.\.t, sprintId \} : t\r?\n          \),\r?\n        \}\)\),\r?\n\r?\n/, '');
content = content.replace(/      \/\/ ── Gamification ──[\s\S]*?\}\r?\n      \},\r?\n\r?\n/, '');

// 10. Store Settings
const settingsOld = /      settings: \{[\s\S]*?tdahSubtype: "mixte",\r?\n      \},/;
const settingsNew = `      settings: {
        enableSounds: true,
      },`;
content = content.replace(settingsOld, settingsNew);

// 11. Fix addTask maxDailyTasks
content = content.replace(/const targetStatus = status \?\? \(tasks\.filter\(\(t\) => t\.status === "today"\)\.length < settings\.maxDailyTasks \? "today" : "inbox"\);/, 'const targetStatus = status ?? "today";');

fs.writeFileSync('src/store/useAppStore.ts', content);
console.log('Store updated properly');
