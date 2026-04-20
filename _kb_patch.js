const fs=require('fs');
const p='C:\\Users\\gpasd\\Documents\\GitHub\\dopatask-os-deploy\\src\\components\\taches\\KanbanBoard.tsx';
let txt=fs.readFileSync(p,'utf8');
const before=txt;
const changes=[];
function replace(re,sub,label){
  const m=txt.match(re);
  if(m){ txt=txt.replace(re,sub); changes.push('OK:'+label); }
  else { changes.push('MISS:'+label); }
}

// 1) Header wrapper padding (reduce px-10 pt-10 pb-6)
replace(
  /<div className="shrink-0 px-10 pt-10 pb-6 border-b border-b-primary">/,
  '<div className="shrink-0 px-8 pt-7 pb-5 border-b border-b-primary">',
  'header-wrapper'
);

// 2) Stats grid: replace entire grid-cols-4 block with new cards
// Pattern spans lines 547-564 — grid opens with className="grid grid-cols-4 gap-3 mb-6"
// We replace from the comment "{/* Stats */}" through the closing </div> of the grid
replace(
  /\{\/\* Stats[^\n]*\*\/\}[\s\S]*?<div className="grid grid-cols-4 gap-3 mb-6">[\s\S]*?<\/motion\.div>\s*<\/div>/,
`{/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="relative px-4 py-3 rounded-xl bg-surface border border-b-primary overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--accent-blue)" }} />
            <p className="text-[10px] uppercase tracking-wider text-t-tertiary mb-1 font-medium">Total</p>
            <p className="text-xl font-semibold text-t-primary tabular-nums">{stats.totalTasks}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative px-4 py-3 rounded-xl bg-surface border border-b-primary overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--accent-cyan)" }} />
            <p className="text-[10px] uppercase tracking-wider text-t-tertiary mb-1 font-medium">Temps moyen</p>
            <p className="text-xl font-semibold text-t-primary tabular-nums">{stats.avgEstimatedTime}<span className="text-sm text-t-secondary ml-0.5">m</span></p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative px-4 py-3 rounded-xl bg-surface border border-b-primary overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "var(--accent-red)" }} />
            <p className="text-[10px] uppercase tracking-wider text-t-tertiary mb-1 font-medium">Haute priorité</p>
            <p className="text-xl font-semibold text-t-primary tabular-nums">{stats.byPriority[5] || 0}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="relative px-4 py-3 rounded-xl bg-surface border border-b-primary overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: selectedTasks.size > 0 ? "var(--accent-purple)" : "var(--border-primary)" }} />
            <p className="text-[10px] uppercase tracking-wider text-t-tertiary mb-1 font-medium">Sélection batch</p>
            <p className="text-xl font-semibold text-t-primary tabular-nums">{selectedTasks.size}</p>
          </motion.div>
        </div>`,
  'stats-grid'
);

// 3) Filter & Sort Bar - flatten flex-wrap to single row, unify heights
replace(
  /<div className="flex flex-wrap items-center gap-3">/,
  '<div className="flex items-center gap-2 flex-nowrap">',
  'filter-bar-container'
);

// 4) Search input container - make less dominant, consistent height
replace(
  /<div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface border border-b-primary flex-1([^"]*)">/,
  '<div className="flex items-center gap-2 px-3.5 h-9 rounded-xl bg-surface border border-b-primary flex-1 min-w-0 focus-within:border-accent-blue/50 transition-colors">',
  'search-container'
);

// 5) Selects - shared pretty style, consistent height
replace(
  /className="text-\[11px\] px-3 py-2 rounded-2xl bg-surface border border-b-primary text-t-primary focus:outline-none cursor-pointer"\s*>\s*<option value="">Tous les projets<\/option>/,
  'className="text-[12px] h-9 px-3 rounded-xl bg-surface border border-b-primary text-t-primary focus:outline-none cursor-pointer hover:border-t-tertiary transition-colors"\n                >\n                  <option value="">Tous les projets</option>',
  'select-projets'
);

replace(
  /className="text-\[11px\] px-3 py-2 rounded-2xl bg-surface border border-b-primary text-t-primary focus:outline-none cursor-pointer"\s*>\s*<option value="">Tous les tags<\/option>/,
  'className="text-[12px] h-9 px-3 rounded-xl bg-surface border border-b-primary text-t-primary focus:outline-none cursor-pointer hover:border-t-tertiary transition-colors"\n                >\n                  <option value="">Tous les tags</option>',
  'select-tags'
);

replace(
  /className="text-\[11px\] px-3 py-2 rounded-2xl bg-surface border border-b-primary text-t-primary focus:outline-none cursor-pointer"\s*>\s*<option value="">Toutes priorités<\/option>/,
  'className="text-[12px] h-9 px-3 rounded-xl bg-surface border border-b-primary text-t-primary focus:outline-none cursor-pointer hover:border-t-tertiary transition-colors"\n                >\n                  <option value="">Toutes priorités</option>',
  'select-priority'
);

// 6) Sort pill container
replace(
  /<div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface border border-b-primary">\s*<ArrowUpDown size=\{12\} className="text-t-secondary" \/>/,
  '<div className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-surface border border-b-primary hover:border-t-tertiary transition-colors">\n                <ArrowUpDown size={12} className="text-t-secondary" />',
  'sort-container'
);

// 7) Ajout prioritaire button - nicer styling
replace(
  /<button\s+onClick=\{\(\) => setShowPriorityAdd\(true\)\}\s+className="flex items-center gap-2 px-4 py-2 rounded-2xl text-\[12px\] font-medium transition-all hover:scale-105"\s+style=\{\{ background: "color-mix\(in srgb, var\(--accent-red\) 10%, transparent\)", color: "var\(--accent-red\)" \}\}/,
  '<button\n                  onClick={() => setShowPriorityAdd(true)}\n                  className="flex items-center gap-2 px-4 h-9 rounded-xl text-[12px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] border"\n                  style={{ background: "color-mix(in srgb, var(--accent-red) 12%, transparent)", color: "var(--accent-red)", borderColor: "color-mix(in srgb, var(--accent-red) 30%, transparent)" }}',
  'priority-button'
);

if(txt!==before){
  fs.writeFileSync(p,txt,'utf8');
  fs.writeFileSync('C:\\Users\\gpasd\\Documents\\GitHub\\dopatask-os-deploy\\_kb_patch.log','CHANGED\n'+changes.join('\n')+'\n');
} else {
  fs.writeFileSync('C:\\Users\\gpasd\\Documents\\GitHub\\dopatask-os-deploy\\_kb_patch.log','NOCHANGE\n'+changes.join('\n')+'\n');
}
console.log('done');
