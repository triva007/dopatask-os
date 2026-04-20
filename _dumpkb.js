const fs=require('fs');
const p='C:\\Users\\gpasd\\Documents\\GitHub\\dopatask-os-deploy\\src\\components\\taches\\KanbanBoard.tsx';
const out='C:\\Users\\gpasd\\Documents\\GitHub\\dopatask-os-deploy\\_kb_';
const txt=fs.readFileSync(p,'utf8');
const lines=txt.split(/\r?\n/);
// write chunks of 50 lines each as separate files 000,001...
let idx=0;
for(let i=0;i<lines.length;i+=50){
  const chunk=lines.slice(i,i+50).join('\n');
  const nn=String(idx).padStart(3,'0');
  fs.writeFileSync(out+nn+'.txt',`// lines ${i+1}-${i+chunk.split('\n').length}\n`+chunk);
  idx++;
}
console.log('chunks written:',idx);
