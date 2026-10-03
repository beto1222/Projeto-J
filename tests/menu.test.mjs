import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');

test('Menu principal possui cinco botões reais e animados',()=>{
 const ids=['continueGame','newTurn','openSettings','openStory','exitGame'];
 for(const id of ids) assert.match(html,new RegExp(`id="${id}"`));
 assert.equal((html.match(/class="menu-action/g)||[]).length,5);
 assert.match(css,/@keyframes menuButtonIn/);
 assert.match(css,/@keyframes menuButtonClick/);
 assert.match(css,/\.menu-action:hover/);
 for(const id of ids) assert.match(js,new RegExp(`\\$\\('${id}'\\)\\.onclick`));
});

test('Menu inclui painéis e retorno da pausa',()=>{
 for(const id of ['menuSettings','menuStory','menuExit','menuFromPause']) assert.match(html,new RegExp(`id="${id}"`));
 assert.match(js,/saveCheckpoint/);
 assert.match(js,/returnToMainMenu/);
});
