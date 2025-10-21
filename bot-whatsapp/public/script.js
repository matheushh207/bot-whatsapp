
let grupos = [], selecionados = new Set(), history = [];

async function fetchQR() {
    const res = await fetch('/qr');
    const data = await res.json();
    const qrImg = document.getElementById('qrImg');
    if (data.qr) qrImg.src = data.qr;
    else document.getElementById('qrContainer').innerHTML = '<p>✅ WhatsApp conectado!</p>';
}

async function fetchGrupos() {
    const res = await fetch('/grupos');
    grupos = await res.json();
    renderSelect(); renderTags();
}

function renderSelect() {
    const select = document.getElementById('grupoSelect');
    select.innerHTML = '';
    grupos.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id; opt.textContent = g.name;
        if(selecionados.has(g.id)) opt.selected = true;
        select.appendChild(opt);
    });
}

function renderTags() {
    const container = document.getElementById('tagsContainer');
    container.innerHTML = '';
    selecionados.forEach(id => {
        const grupo = grupos.find(g=>g.id===id); if(!grupo) return;
        const tag = document.createElement('div'); tag.className='tag';
        tag.textContent = grupo.name;
        const remove = document.createElement('span'); remove.textContent='✖';
        remove.onclick=()=>{ selecionados.delete(id); renderSelect(); renderTags(); };
        tag.appendChild(remove); container.appendChild(tag);
    });
}

function renderHistory() {
    const container = document.getElementById('historyItems'); container.innerHTML='';
    history.forEach(h=>{
        const div=document.createElement('div'); div.className='history-item';
        div.innerHTML=`<strong>${h.timestamp}</strong>: ${h.mensagem}`;
        container.appendChild(div);
    });
}

document.getElementById('grupoSelect').addEventListener('change', e=>{
    selecionados=new Set(Array.from(e.target.selectedOptions).map(o=>o.value));
    renderTags();
});

document.getElementById('enviarBtn').addEventListener('click', async ()=>{
    const mensagem=document.getElementById('mensagem').value;
    if(!mensagem||selecionados.size===0) return alert('Preencha a mensagem e selecione pelo menos um grupo!');
    document.getElementById('status').textContent='⏳ Enviando...';
    const res=await fetch('/enviar',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({grupoIds:Array.from(selecionados),mensagem}) });
    const data=await res.json();
    if(data.success){
        history=data.history; renderHistory();
        document.getElementById('status').textContent=`✅ Mensagem enviada para ${data.enviados.length} grupo(s)`;
        document.getElementById('totalEnviado').textContent=data.enviados.length;
    } else document.getElementById('status').textContent='❌ Erro: '+(data.error||'Desconhecido');
});

document.getElementById('atualizarGruposBtn').addEventListener('click', async ()=>{
    await fetchGrupos(); alert('✅ Lista de grupos atualizada!');
});

fetchQR(); setInterval(fetchQR,5000); fetchGrupos();
