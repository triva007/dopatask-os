const fs=require('fs');
const p='C:\\Users\\gpasd\\Documents\\GitHub\\dopatask-os-deploy\\src\\components\\taches\\KanbanBoard.tsx';
let txt=fs.readFileSync(p,'utf8');
const before=txt;
const log=[];

// --- 1) Stats grid replace (all 4 motion.div cards inside grid grid-cols-4) ---
// Locate grid opening and match up to its matching closing </div>
const gridOpen = txt.indexOf('<div className="grid grid-cols-4 gap-3 mb-6">');
if (gridOpen === -1) {
  // maybe already replaced
  log.push('MISS: grid open not found (maybe already patched)');
} else {
  // Find the matching </div> by counting nested divs
  let i = gridOpen;
  const openTag = '<div';
  const closeTag = '</div>';
  let depth = 0;
  let end = -1;
  while (i < txt.length) {
    const nextOpen = txt.indexOf(openTag, i);
    const nextClose = txt.indexOf(closeTag, i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) { end = nextClose + closeTag.length; break; }
      i = nextClose + closeTag.length;
    }
  }
  if (end === -1) { log.push('MISS: grid close not found'); }
  else {
    const newGrid = `<div className="grid grid-cols-4 gap-2 mb-5">
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
        </div>`;
    txt = txt.slice(0, gridOpen) + newGrid + txt.slice(end);
    log.push('OK: grid replaced, old='+(end-gridOpen)+' new='+newGrid.length);
  }
}

// --- 2) Priority button - try a simpler match ---
const btnIdx = txt.indexOf('onClick={() => setShowPriorityAdd(true)}');
if (btnIdx !== -1) {
  // find the surrounding <button opening before and closing >
  const btnStart = txt.lastIndexOf('<button', btnIdx);
  const gtAfter = txt.indexOf('>', btnIdx);
  if (btnStart !== -1 && gtAfter !== -1) {
    const oldBtn = txt.slice(btnStart, gtAfter + 1);
    const newBtn = `<button
                  onClick={() => setShowPriorityAdd(true)}
                  className="flex items-center gap-2 px-4 h-9 rounded-xl text-[12px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] border"
                  style={{ background: "color-mix(in srgb, var(--accent-red) 12%, transparent)", color: "var(--accent-red)", borderColor: "color-mix(in srgb, var(--accent-red) 30%, transparent)" }}
                >`;
    txt = txt.slice(0, btnStart) + newBtn + txt.slice(gtAfter + 1);
    log.push('OK: priority button replaced');
  } else {
    log.push('MISS: priority button bounds');
  }
} else {
  log.push('MISS: priority button anchor (maybe already patched)');
}

if (txt !== before) {
  fs.writeFileSync(p, txt, 'utf8');
  fs.writeFileSync('C:\\Users\\gpasd\\Documents\\GitHub\\dopatask-os-deploy\\_kb_patch2.log','CHANGED\n'+log.join('\n')+'\n');
} else {
  fs.writeFileSync('C:\\Users\\gpasd\\Documents\\GitHub\\dopatask-os-deploy\\_kb_patch2.log','NOCHANGE\n'+log.join('\n')+'\n');
}
console.log('done');
