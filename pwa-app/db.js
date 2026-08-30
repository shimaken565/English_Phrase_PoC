const DB_NAME='english-phrase-book',
DB_VERSION=1;
export const STORES={
  categories:'categories',
  phrases:'phrases',
  settings:'settings'
};
let opening;
export function openDatabase(){
  if(opening)return opening;
  opening=new Promise((resolve,
  reject)=>{
    const r=indexedDB.open(DB_NAME,
    DB_VERSION);
    r.onupgradeneeded=e=>{
      const db=e.target.result;
      if(!db.objectStoreNames.contains('categories'))db.createObjectStore('categories',
      {
        keyPath:'id'
      });
      if(!db.objectStoreNames.contains('phrases')){
        const s=db.createObjectStore('phrases',
        {
          keyPath:'id'
        });
        s.createIndex('majorId',
        'majorId');
        s.createIndex('minorId',
        'minorId');
        s.createIndex('displayOrder',
        'displayOrder')
      }
      if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',
      {
        keyPath:'key'
      })
    };
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
    r.onblocked=()=>reject(new Error('IndexedDBの更新がブロックされました'))
  });
  return opening
}
const req=(s,
m,
...a)=>new Promise((ok,
no)=>{
  const r=s[m](...a);
  r.onsuccess=()=>ok(r.result);
  r.onerror=()=>no(r.error)
});
const run=(stores,
mode,
fn)=>openDatabase().then(db=>new Promise((ok,
no)=>{
  const t=db.transaction(stores,
  mode);
  let result;
  try{
    result=fn(t)
  }
  catch(e){
    no(e);
    return
  }
  t.oncomplete=()=>ok(result);
  t.onerror=()=>no(t.error||Error('IndexedDB操作に失敗しました'));
  t.onabort=()=>no(t.error||Error('IndexedDB操作が中断されました'))
}));
export const id=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`;
export async function listCategories(){
  const d=await openDatabase(),
  r=await req(d.transaction('categories').objectStore('categories'),
  'getAll');
  return r.sort((a,
  b)=>(a.order||0)-(b.order||0))
}
export async function listPhrases(){
  const d=await openDatabase(),
  r=await req(d.transaction('phrases').objectStore('phrases'),
  'getAll');
  return r.sort((a,
  b)=>(a.displayOrder||0)-(b.displayOrder||0))
}
export const saveCategory=x=>run(['categories'],
'readwrite',
t=>t.objectStore('categories').put(x));
export const savePhrase=x=>run(['phrases'],
'readwrite',
t=>t.objectStore('phrases').put(x));
export const deletePhrase=x=>run(['phrases'],
'readwrite',
t=>t.objectStore('phrases').delete(x));
export const deleteCategoryCascade=async cid=>run(['categories',
'phrases'],
'readwrite',
t=>{
  const cs=t.objectStore('categories'),
  ps=t.objectStore('phrases');
  const cr=cs.openCursor();
  cr.onsuccess=()=>{
    const c=cr.result;
    if(!c)return;
    if(c.key===cid||c.value.parentId===cid)c.delete();
    c.continue()
  };
  const pr=ps.openCursor();
  pr.onsuccess=()=>{
    const c=pr.result;
    if(!c)return;
    const p=c.value;
    if(p.majorId===cid||p.minorId===cid||p.categoryId===cid)c.delete();
    c.continue()
  }
});
export async function getDatabaseInfo(){
  const d=await openDatabase();
  return{
    name:DB_NAME,
    version:d.version,
    stores:[...d.objectStoreNames]
  }
}
