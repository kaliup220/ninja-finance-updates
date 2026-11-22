const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');
const APP_NAME = 'Ninja Finance';
const dataDir = path.join(app.getPath('appData'), 'NinjaFinance');
const dataFile = path.join(dataDir, 'finance_data.json');
const logFile = path.join(dataDir, 'startup.log');
function log(msg) { try { fs.mkdirSync(dataDir,{recursive:true}); fs.appendFileSync(logFile,`\n[${new Date().toISOString()}] ${msg}\n`,'utf8'); } catch {} }
function atomicWrite(file, content) { fs.mkdirSync(path.dirname(file),{recursive:true}); const tmp=file+'.tmp'; fs.writeFileSync(tmp,content,{encoding:'utf8'}); fs.renameSync(tmp,file); }
function validate(payload) { if (!payload || typeof payload!=='object' || !Array.isArray(payload.movements)) throw new Error('Dados financeiros inválidos.'); return {version:3, initialBalance:Number(payload.initialBalance)||0, movements:payload.movements, goals:payload.goals||{revenue:0,profit:0,reserve:0}}; }
function migrateJsonData(data) { const normalized=validate(data); if(Number(data.version)===2){const backup=dataFile+'.v2-backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json'; fs.copyFileSync(dataFile,backup); atomicWrite(dataFile,JSON.stringify(normalized,null,2)); log('migrated JSON v2 to v3; backup='+path.basename(backup));} return normalized; }
function createWindow() { const win=new BrowserWindow({width:1200,height:850,minWidth:760,minHeight:560,resizable:true,backgroundColor:'#101414',title:APP_NAME,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}}); win.loadFile(path.join(__dirname,'index.html')); win.webContents.on('did-fail-load',(_e,code,desc,url)=>log(`did-fail-load code=${code} description=${desc} url=${url}`)); win.webContents.on('render-process-gone',(_e,details)=>log(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`)); win.webContents.on('console-message',(_e,level,message,line,source)=>log(`console level=${level} ${message} (${source}:${line})`)); win.on('ready-to-show',()=>log('window ready-to-show')); return win; }
ipcMain.handle('finance:load',()=>{ log('load requested'); if(!fs.existsSync(dataFile)) return {hasData:false,movements:[],initialBalance:0,goals:{revenue:0,profit:0,reserve:0}}; try {const d=migrateJsonData(JSON.parse(fs.readFileSync(dataFile,'utf8'))); log(`data loaded; movements=${d.movements.length}`); return {hasData:true,movements:d.movements,initialBalance:d.initialBalance,goals:d.goals};} catch(err){log('load error '+err.stack); throw new Error('Não foi possível ler os dados financeiros: '+err.message);}});
ipcMain.handle('finance:save',(_e,payload)=>{const clean=validate(payload); atomicWrite(dataFile,JSON.stringify(clean,null,2)); log(`saved movements=${clean.movements.length}`); return {ok:true};});
ipcMain.handle('finance:backup',async(_e,payload)=>{const clean=validate(payload); const result=await dialog.showSaveDialog({defaultPath:'ninja_finance_backup.json',filters:[{name:'JSON',extensions:['json']}],title:'Salvar backup Ninja Finance'}); if(result.canceled||!result.filePath) return {cancelled:true}; fs.writeFileSync(result.filePath,JSON.stringify(clean,null,2),'utf8'); return {ok:true,path:result.filePath};});
ipcMain.handle('finance:restore',async()=>{const result=await dialog.showOpenDialog({title:'Restaurar backup Ninja Finance',properties:['openFile'],filters:[{name:'JSON',extensions:['json']}]}); if(result.canceled||!result.filePaths.length) return {cancelled:true}; try{const data=JSON.parse(fs.readFileSync(result.filePaths[0],'utf8')); if(!data||!Array.isArray(data.movements)) throw new Error('Arquivo de backup inválido'); return {ok:true,data};}catch(err){return {ok:false,error:err.message};}});
ipcMain.handle('finance:log',(_e,message)=>{log('renderer: '+String(message).slice(0,1500)); return {ok:true};});

// GitHub Releases updater; financial records remain in AppData outside installation.
autoUpdater.autoDownload=false; autoUpdater.autoInstallOnAppQuit=true; autoUpdater.allowPrerelease=false;
let updateState={status:'idle',message:'Pronto para verificar atualizações.',version:app.getVersion()};
function pushUpdateState(patch){updateState={...updateState,...patch};BrowserWindow.getAllWindows().forEach(w=>{if(!w.isDestroyed())w.webContents.send('updates:state',updateState);});}
ipcMain.handle('updates:state',()=>updateState);
ipcMain.handle('updates:check',async()=>{if(!app.isPackaged){pushUpdateState({status:'dev',message:'Verificação disponível na versão instalada.'});return updateState;}try{pushUpdateState({status:'checking',message:'Verificando atualizações...'});await autoUpdater.checkForUpdates();return updateState;}catch(e){pushUpdateState({status:'error',message:'Erro ao verificar: '+e.message});return updateState;}});
ipcMain.handle('updates:download',async()=>{try{pushUpdateState({status:'downloading',message:'Baixando atualização...'});await autoUpdater.downloadUpdate();return updateState;}catch(e){pushUpdateState({status:'error',message:'Falha no download: '+e.message});return updateState;}});
ipcMain.handle('updates:install',()=>{if(updateState.status==='downloaded')autoUpdater.quitAndInstall(false,true);return updateState;});
autoUpdater.on('checking-for-update',()=>pushUpdateState({status:'checking',message:'Verificando atualizações...'}));
autoUpdater.on('update-available',i=>pushUpdateState({status:'available',message:`Atualização ${i.version} disponível.`,availableVersion:i.version}));
autoUpdater.on('update-not-available',i=>pushUpdateState({status:'none',message:`Você já está na versão mais recente (${i.version}).`}));
autoUpdater.on('download-progress',p=>pushUpdateState({status:'downloading',message:`Baixando atualização: ${Math.round(p.percent)}%`,percent:p.percent}));
autoUpdater.on('update-downloaded',i=>pushUpdateState({status:'downloaded',message:`Versão ${i.version} baixada. Pronta para instalar.`,availableVersion:i.version}));
autoUpdater.on('error',e=>pushUpdateState({status:'error',message:'Erro no atualizador: '+e.message}));

app.whenReady().then(()=>{log(`Electron start version=${process.versions.electron} chrome=${process.versions.chrome}`);createWindow();if(app.isPackaged)setTimeout(()=>autoUpdater.checkForUpdates().catch(e=>pushUpdateState({status:'error',message:'Erro ao verificar: '+e.message})),7000); app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
