const path = location.pathname;
const preview = /\/preview\.html$/.test(path);
const laboratory = /\/lab\.html$/.test(path);
async function start() {
 if (laboratory) {
  const { startLab } = await import('./lab/start-lab');
  await startLab();
 } else {
  const { startPlayer } = await import('./app/player-app');
  const scene = new URLSearchParams(location.search).get('scene');
  const labScene = preview && ['free', 'drop', 'stack', 'depth'].includes(scene ?? '') ? scene as import('./physics').Scene : undefined;
  await startPlayer(document.getElementById('app')!, { labScene });
 }
}
start().catch(error => {
 console.error(error);
 const status = document.getElementById('loading') ?? document.getElementById('app');
 if (status) status.textContent = 'No se pudo iniciar el juguete. Recarga en un navegador compatible con WebGL.';
});
