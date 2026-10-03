export function install(api){
 const panel=document.createElement('div');panel.style='position:fixed;left:10px;bottom:10px;z-index:30;background:#112c21;padding:10px;font:12px monospace';
 const inspect=document.createElement('button'),run=document.createElement('button'),output=document.createElement('output');
 inspect.textContent='QA: INSPECIONAR TOMATE';run.textContent='QA: TESTAR SEIS TURNOS';output.style='display:block;max-width:650px;white-space:pre-wrap';panel.append(inspect,run,output);document.body.append(panel);
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
 const key=(type)=>window.dispatchEvent(new KeyboardEvent(type,{code:'Space',bubbles:true}));
 inspect.onclick=()=>{api.start();api.action('ticket');api.action('basket');api.action('board');panel.hidden=true;};
 run.onclick=async()=>{run.disabled=inspect.disabled=true;try{
  api.start();let total=0;
  assert(!api.canMove(0,6.65),'Bancada sem colisão');assert(api.canMove(4.9,1.15),'Passagem bloqueada');
  for(let shift=0;shift<6;shift++){
   api.action('ticket');api.action('basket');assert(api.service.stage==='carrying','Tomate não foi pego');api.action('board');assert(api.cutting(),'Tábua não abriu');
   const count=api.service.order.slices;
   for(let i=0;i<count;i++){
    key('keydown');await sleep(850);assert(api.service.cuts===i+1,'Contato da faca não cortou');
    await sleep(200);assert(api.service.cuts===i+1,'Corte duplicado com tecla segurada');key('keyup');await sleep(450);total++;
   }
   assert(api.tomato().pieces[0].faces[1].visible,'Polpa não revelada');api.action('board');
   api.action('assembly');api.action('grill');await sleep(6700);assert(api.service.stage==='ready','Chapa não completou');
   api.action('grill');api.action('serve');assert(api.service.stage===(shift===5?'exit':'clock'),'Entrega falhou');
   api.closeReceipt();output.textContent=`Turno ${shift+1}/6 passou · ${total} cortes com contato, sem duplicação.`;
   if(shift<5)api.action('clock');
  }
  api.action('exit');assert(api.service.finished,'Final não alcançado');output.textContent=`PASSOU: 6 turnos, ${total} cortes, montagem, chapa, entrega, colisões e saída final.`;
 }catch(e){key('keyup');output.textContent='FALHOU: '+e.message;console.error(e);}};
}
