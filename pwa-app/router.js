const routes=new Map();
let current,
root;
const routeName=path=>{
  const raw=String(path||'').replace(/^#/,
  '');
  return raw.split('?')[0]||'home'
};
export function initRouter(element){
  root=element;
  addEventListener('popstate',
  ()=>{
    render(location.hash.slice(1)||'home')
  });
  return render(location.hash.slice(1)||'home')
}
export function route(path){
  history.pushState({
  },
  '',
  '#'+path);
  return render(location.hash.slice(1)||'home')
}
export function replaceRoute(path){
  history.replaceState({
  },
  '',
  '#'+path);
  return render(location.hash.slice(1)||'home')
}
export function register(path,
renderPage){
  routes.set(path,
  renderPage)
}
export function render(path){
  current=path;
  const name=routeName(path),
  page=routes.get(name);
  if(!page)return render('home');
  try{
    root.replaceChildren(page())
  }
  catch(error){
    console.error('Failed to render route',
    name,
    error);
    return render('home')
  }
  return current
}
