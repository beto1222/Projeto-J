export const SHIFTS = [
  {time:'22:10',name:'A casa ainda está aberta',customer:'MESA 02 · AUGUSTO',slices:3,note:'O de sempre. Bem tostado, por favor.',opening:'RENATO · Filho, a comanda fica à esquerda. Pão, ovo e tomate. Sirva no balcão e bata o ponto quando terminar.',after:'AUGUSTO · Está perfeito. Até amanhã.',receipt:'Augusto pagou e desejou boa noite. Seu pai, Renato, pede pelo rádio que você confira o fechamento. Tudo parece normal.'},
  {time:'23:40',name:'O número repetido',customer:'MESA 04 · HELENA',slices:4,note:'Corte fino. Tenho uma longa viagem.',opening:'RENATO · Mais um antes de fechar. Se a impressora repetir um número, é só o papel preso.',after:'HELENA · Esta mesa já estava reservada?',receipt:'No verso da comanda: “Otávio — verificar exaustor. Avisei Bento duas vezes.” A data é de muitos anos atrás.'},
  {time:'01:15',name:'Três batidas',customer:'MESA 04 · SEM NOME',slices:3,note:'Sem pressa. Eu consigo esperar.',opening:'Três batidas. A comanda saiu antes de alguém entrar. Renato não responde ao rádio.',after:'VOZ NO VIDRO · Eu ainda estou esperando.',receipt:'Uma cópia do relatório: “Falha no exaustor. Funcionário retido na câmara fria.” A última linha foi riscada. Você reconhece a letra do seu pai.'},
  {time:'02:17',name:'Um lugar a mais',customer:'MESA 04 · RESERVA',slices:4,note:'Deixe uma cadeira livre.',opening:'As cadeiras estão viradas para a cozinha. RENATO · Não mexa nesses papéis. Apenas termine o pedido.',after:'CLIENTE · Falta um de nós.',receipt:'O rádio chia: “Eu ouvi as batidas. Liguei para Bento primeiro. Ele disse para esperar.” Renato para de falar. A câmara fria não aparece no relatório final.'},
  {time:'03:33',name:'A mesa vazia',customer:'MESA 04 · OTÁVIO',slices:5,note:'Não precisa chamar. Eu já estou aqui.',opening:'A campainha toca. O salão está vazio. Há passos acompanhando os seus.',after:'O prato desliza para o outro lado. Não há mãos para recebê-lo.',receipt:'RENATO · Eu devia ter aberto a porta. Não era o encanamento, filho. Era ele. No papel, uma frase nova: “Eu só queria que alguém lembrasse meu nome.”'},
  {time:'06:00',name:'O último pedido',customer:'MESA 04 · OTÁVIO',slices:6,note:'Pedido 217. Pão tostado, ovo e tomate.',opening:'Todas as mesas estão ocupadas. Ninguém respira. O pedido 217 voltou. Prepare o prato de Otávio e encerre o serviço.',after:'OTÁVIO · Obrigado por lembrar.',receipt:'PEDIDO 217 — ENTREGUE A OTÁVIO. As batidas cessaram. A voz de Renato finalmente diz o nome que faltava no relatório. A porta SAÍDA está aberta.'}
];

export class Service {
  constructor(){this.shift=0;this.stage='ticket';this.cuts=0;this.toast=0;this.finished=false;}
  get order(){return SHIFTS[this.shift];}
  get cutPlanes(){return Array.from({length:this.order.slices},(_,i)=>-.32+(i+.5)*.64/this.order.slices);}
  act(station){
    if(this.finished)return {ok:false,message:'O serviço terminou.'};
    if(station==='ticket'&&this.stage==='ticket'){this.stage='pick';return {ok:true,event:'order'};}
    if(station==='basket'&&this.stage==='pick'){this.stage='carrying';return {ok:true,event:'tomatoPicked'};}
    if(station==='board'&&this.stage==='carrying'){this.stage='cut';return {ok:true,event:'tomatoPlaced'};}
    if(station==='board'&&this.stage==='cut')return {ok:true,event:'board'};
    if(station==='assembly'&&this.stage==='assemble'){this.stage='grill';return {ok:true,event:'assembled'};}
    if(station==='grill'&&this.stage==='grill'){this.stage='toasting';this.toast=0;return {ok:true,event:'toasting'};}
    if(station==='grill'&&this.stage==='ready'){this.stage='deliver';return {ok:true,event:'pickup'};}
    if(station==='serve'&&this.stage==='deliver'){this.stage=this.shift===5?'exit':'clock';return {ok:true,event:'served'};}
    if(station==='clock'&&this.stage==='clock'){this.shift++;this.stage='ticket';this.cuts=this.toast=0;return {ok:true,event:'shift'};}
    if(station==='exit'&&this.stage==='exit'){this.finished=true;return {ok:true,event:'ending'};}
    return {ok:false,message:this.hint()};
  }
  cut(x,edgeHeight){
    if(!Number.isFinite(x)||!Number.isFinite(edgeHeight)||this.stage!=='cut'||edgeHeight>.035||Math.abs(x-this.cutPlanes[this.cuts])>.065)return false;
    this.cuts++;
    if(this.cuts===this.order.slices)this.stage='assemble';
    return true;
  }
  update(dt){if(this.stage!=='toasting')return false;this.toast=Math.min(6,this.toast+Math.max(0,dt));if(this.toast>=6){this.stage='ready';return true;}return false;}
  hint(){return {
    ticket:'Retire a comanda na impressora, à esquerda.',
    pick:'Pegue um tomate na cesta de ingredientes, à esquerda da tábua.',
    carrying:'Leve o tomate até a tábua de madeira e apoie-o.',
    cut:`Corte o tomate na tábua: ${this.cuts} / ${this.order.slices} cortes.`,
    assemble:'Monte o pão com tomate, ao lado da tábua.',
    grill:'Leve à chapa para tostar o pão e fritar o ovo.',
    toasting:'Aguarde a chapa. O pão e o ovo estão cozinhando.',
    ready:'Recolha o prato de pão, ovo e tomate.',
    deliver:'Entregue no balcão, em frente ao salão.',
    clock:'Leia o recibo e bata o ponto junto à impressora.',
    exit:'Saia pela porta SAÍDA ao lado do balcão.'
  }[this.stage];}
}
