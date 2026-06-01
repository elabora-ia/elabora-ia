"use client";
import { useState } from "react";

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Dif = { mfacil:number; facil:number; medio:number; dificil:number; mdificil:number };
type Modelos = { direta:number; assertivas:number; vf:number; lacunas:number; colunas:number; ar:number; ordem:number };
type Conteudo = { id:number; nome:string; qtd:number; tipo:"objetiva"|"discursiva"; texto:string };
type Config = { titulo:string; nivel:string; nAlt:number; dif:Dif; modelos:Modelos; conteudos:Conteudo[]; instrucao:string; nextContId:number };
type Diagnostico = { risco:string; justificativa_risco:string; problemas:string[]; instrucao_reescrita:string };
type Questao = { id:number; numero:string; conteudo:string; corpo:string; defesa:string; aprovada:boolean; diagnostico:Diagnostico|null };
type Prova = { id:number; nome:string; config:Config; questoes:Questao[] };
type Projeto = { id:number; nome:string; provas:Prova[] };

// ─── Cores ───────────────────────────────────────────────────────────────────
const C = {
  vd:"#1a3d00",        // verde escuro — texto principal
  vm:"#4a8a00",        // verde médio — destaques
  bg:"#f4f9ef",        // fundo geral verde muito claro
  borda:"#b8d98a",     // bordas verdes claras
  card:"#e8f4d8",      // fundo de cards
  branco:"#ffffff",    // branco puro
  erro:"#cc2200",      // erro
  erroBg:"#fff0ee",    // fundo erro
  aviso:"#3a7a00",     // aviso
  avisoBg:"#f0f9e0",   // fundo aviso
};

// ─── API ─────────────────────────────────────────────────────────────────────
async function callAPI(system:string, prompt:string, maxTokens=8000): Promise<string> {
  const res = await fetch("/api/gerar", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ system, prompt, maxTokens }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text || "";
}

// ─── System Prompt ───────────────────────────────────────────────────────────
function getSP(nAlt:number): string {
  const a5 = nAlt>=5 ? "<alternativa 5 - distrator>\n" : "";
  const j5 = nAlt>=5 ? "\n<texto exato da alternativa 5>\n<explicacao do erro>\n" : "";
  return `Voce e um especialista senior em elaboracao de questoes para concursos publicos brasileiros de alto nivel. Produza questoes ineditas, tecnicamente impecaveis, linguagem formal e precisa, gabarito inequivoco e defesa fundamentada.

ESTRUTURA - QUESTAO OBJETIVA:

<Nome do Conteudo>
<numero.>
<enunciado completo>

<alternativa 1 - SEMPRE a correta, SEM marcador de letra>
<alternativa 2 - distrator>
<alternativa 3 - distrator>
<alternativa 4 - distrator>
${a5}
Defesa:
<resolucao passo a passo ou fundamentacao com citacao ABNT>

Justificativas dos distratores:

<texto exato da alternativa 2>
<explicacao do erro>

<texto exato da alternativa 3>
<explicacao do erro>

<texto exato da alternativa 4>
<explicacao do erro>
${j5}
(tres linhas em branco entre questoes)

ESTRUTURA - QUESTAO DISCURSIVA:

<Nome do Conteudo>
<numero.>
<introducao contextual>
<texto base se houver>
<pergunta(s)>

Resposta esperada:
<resposta direta - maximo 5 linhas>

Gabarito comentado:
<explicacao detalhada>

(tres linhas em branco entre questoes)

REGRAS:
1. Nunca inclua o titulo do documento no texto das questoes.
2. VARIACAO DO COMANDO: proibido reusar variantes de Uma/Um/Em uma/Em um/Numa/Num/Certa/Certo/Determinada/Determinado. Varie estrutura sintatica inteira.
3. TAMANHO: min 300, max 600 caracteres no enunciado.
4. Texto base: elaborar exclusivamente a partir dele, referenciar explicitamente, transcrito antes do enunciado.

NIVEIS:
- Fundamental: linguagem simples, cotidiano, operacoes basicas.
- Medio: linguagem intermediaria, curriculo EM, ate duas etapas.
- Superior: linguagem tecnica, alta complexidade, multiplas etapas, equivalente a Receita Federal, TCU, magistratura. NUNCA etapa unica.

DIFICULDADE:
- Muito Facil: acerta em menos de 30s.
- Facil: basico, uma etapa intermediaria.
- Medio: 2-3 etapas, candidato mediano tem duvida real.
- Dificil: aprofundado, distratores convincentes.
- Muito Dificil: dominio pleno, multietapas, so alto desempenho.

MODELO 1 - OBJETIVA DIRETA: ${nAlt} alternativas. Primeira correta (sem letra). Varie forma: Qual e..., Calcule..., De acordo com..., No que se refere a..., Sobre..., A respeito de...
MODELO 2 - ASSERTIVAS: introducao obrigatoria. I.Texto. Apos: "Esta CORRETO o que se afirma em:" Combinacoes PARCIAIS. PROIBIDO todas ou nenhuma.
MODELO 3 - V/F: introducao obrigatoria. ()Texto. Apos: "A sequencia CORRETA, de cima para baixo, e:" PROIBIDO V,V,V,V ou F,F,F,F.
MODELO 4 - LACUNAS: enunciado com ___ . ${nAlt} alternativas.
MODELO 5 - COLUNAS: (1)-(4) e a)-d). Apos: "A associacao CORRETA e:" ${nAlt} alternativas.
MODELO 6 - ASSERCAO E RAZAO: AFIRMACAO: e RAZAO: ${nAlt} alternativas variando V/F.
MODELO 7 - ORDENACAO: I.-IV. Apos: "A sequencia CORRETA, em ordem [...], e:" ${nAlt} alternativas.

PADROES: virgula para decimais, ponto para milhar. Simbolos: pi, theta, sigma, sqrt, grau, %, x, divisao.
DEFESA quantitativa: resolucao calculo por linha + justificativas de TODOS os distratores.
DEFESA qualitativa: trecho real entre aspas + fonte ABNT real + explicacao 2-3 linhas + justificativas de TODOS.
NUNCA referenciar posicao da alternativa correta.
CONTEXTO MATEMATICO: CIDADES FICTCIAS, EMPRESAS FICTCIAS, PESSOAS FICTCIAS variadas. Nunca repetir nomes.
ALTERNATIVAS: nunca repetir trecho do enunciado na correta. Toda alternativa termina com ponto.
REVISAO: sem palavra inicial repetida; sem padrao repetido; enunciados 300-600 chars; ao menos uma Objetiva Direta com multiplos modelos. Reescreva qualquer falha.
INEGOCIAVEL: ${nAlt} alternativas completas. Defesa completa. Justificativas de TODOS os distratores. Tres linhas em branco apos ultimo distrator.`;
}

// ─── Parser ──────────────────────────────────────────────────────────────────
function parseQs(txt:string): Omit<Questao,"id"|"aprovada"|"diagnostico">[] {
  const qs: Omit<Questao,"id"|"aprovada"|"diagnostico">[] = [];
  const blocos = txt.split(/\n(?=\d+\.\s)/);
  for (const bloco of blocos) {
    const bt = bloco.trim(); if (!bt) continue;
    const m = bt.match(/^(\d+)\./); if (!m) continue;
    const linhas = bt.split("\n");
    let conteudo = "";
    if (linhas[0] && !linhas[0].match(/^\d+\./)) conteudo = linhas[0].trim();
    const partes = bt.split(/\nDefesa:/i);
    const corpo = partes[0].trim();
    const defesa = partes.length > 1 ? "Defesa:\n" + partes.slice(1).join("\nDefesa:").trim() : "";
    qs.push({ numero:m[1], conteudo:conteudo||"Questao "+m[1], corpo, defesa });
  }
  return qs;
}

// ─── Helpers visuais ─────────────────────────────────────────────────────────
const s = {
  inp: { width:"100%", background:"#fff", border:"1.5px solid #b8d98a", borderLeft:"4px solid #4a8a00", borderRadius:"6px", padding:".5rem .7rem", fontSize:".88rem", color:"#1a3d00", fontWeight:600, outline:"none", boxSizing:"border-box" as const, fontFamily:"inherit" },
  lbl: { display:"block", fontSize:".78rem", fontWeight:700, color:"#1a3d00", marginBottom:".25rem" } as React.CSSProperties,
  card: { background:"#fff", border:"1px solid #b8d98a", borderRadius:"8px", padding:"1rem 1.2rem", marginBottom:"1rem", boxShadow:"0 2px 10px rgba(60,120,0,0.08)" },
  secT: { fontSize:".82rem", fontWeight:700, color:"#1a3d00", background:"#e8f4d8", borderLeft:"3px solid #4a8a00", padding:".35rem .9rem", borderRadius:"6px", marginBottom:".9rem", display:"flex", alignItems:"center", gap:".4rem", letterSpacing:".04em" } as React.CSSProperties,
  bp: { background:"linear-gradient(135deg,#1a4a00,#4a8a00)", color:"#CCFF33", border:"none", borderRadius:"6px", padding:".5rem 1.2rem", fontWeight:700, cursor:"pointer", fontSize:".84rem", display:"inline-flex", alignItems:"center", gap:".35rem" } as React.CSSProperties,
  bs: { background:"#f4f9ef", color:"#1a3d00", border:"1.5px solid #4a8a00", borderRadius:"6px", padding:".4rem .9rem", fontWeight:700, cursor:"pointer", fontSize:".80rem" } as React.CSSProperties,
  bd: { background:"#fff0ee", color:"#cc2200", border:"1.5px solid #ffaaaa", borderRadius:"6px", padding:".4rem .9rem", fontWeight:700, cursor:"pointer", fontSize:".80rem" } as React.CSSProperties,
  bxs: { background:"#f4f9ef", color:"#1a3d00", border:"1px solid #4a8a00", borderRadius:"5px", padding:".2rem .55rem", fontWeight:700, cursor:"pointer", fontSize:".72rem" } as React.CSSProperties,
  bdxs: { background:"#fff0ee", color:"#cc2200", border:"1px solid #ffaaaa", borderRadius:"5px", padding:".2rem .55rem", fontWeight:700, cursor:"pointer", fontSize:".72rem" } as React.CSSProperties,
};

function Tag({ children }:{ children:React.ReactNode }) {
  return <span style={{ background:"#e8f4d8", color:"#1a3d00", borderRadius:"99px", padding:"1px 8px", fontSize:".72rem", fontWeight:700, marginLeft:"4px", border:"1px solid #b8d98a" }}>{children}</span>;
}
function Alert({ type="in", children }:{ type?:"in"|"ok"|"er"|"av"; children:React.ReactNode }) {
  const map = {
    in:  { background:"#eef6ff", color:"#1a3a7a", borderLeft:"4px solid #4a7acc" },
    ok:  { background:"#e8f4d8", color:"#1a3d00", borderLeft:"4px solid #4a8a00" },
    er:  { background:"#fff0ee", color:"#cc2200", borderLeft:"4px solid #cc2200" },
    av:  { background:"#f0f9e0", color:"#1a3d00", borderLeft:"4px solid #4a8a00" },
  };
  return <div style={{ borderRadius:"6px", padding:".6rem .9rem", fontSize:".83rem", marginBottom:".8rem", fontWeight:500, ...map[type] }}>{children}</div>;
}
function SecTitle({ children }:{ children:React.ReactNode }) { return <div style={s.secT}>{children}</div>; }
function Spinner() { return <span className="spinner" />; }
function HR() { return <hr style={{ border:"none", borderTop:"1px solid #b8d98a", margin:".9rem 0" }} />; }

// ─── DifGrid ─────────────────────────────────────────────────────────────────
function DifGrid({ dif, onChange }:{ dif:Dif; onChange:(d:Dif)=>void }) {
  const fields:[keyof Dif,string][] = [["mfacil","Muito Fácil (%)"],["facil","Fácil (%)"],["medio","Médio (%)"],["dificil","Difícil (%)"],["mdificil","Muito Difícil (%)"]];
  const total = Object.values(dif).reduce((a,b)=>a+b,0);
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:".5rem" }}>
        {fields.map(([k,l]) => (
          <div key={k} style={{ textAlign:"center" }}>
            <label style={{ fontSize:".68rem", fontWeight:700, color:C.vd, display:"block", minHeight:"2.2rem", lineHeight:1.2 }}>{l}</label>
            <input type="number" value={dif[k]} min={0} max={100} onChange={e=>onChange({...dif,[k]:parseInt(e.target.value)||0})} style={{ ...s.inp, textAlign:"center" }} />
          </div>
        ))}
      </div>
      <div style={{ textAlign:"center", fontSize:".82rem", fontWeight:700, padding:".4rem", borderRadius:"6px", marginTop:".4rem", background:total===100?C.card:C.erroBg, color:total===100?C.vd:C.erro }}>
        Total: {total}% {total===100?"✓":"✗ (precisa ser 100%)"}
      </div>
    </div>
  );
}

// ─── ConteudoRow ─────────────────────────────────────────────────────────────
function ConteudoRow({ c, onChange, onRemove }:{ c:Conteudo; onChange:(c:Conteudo)=>void; onRemove:()=>void }) {
  const [showTB, setShowTB] = useState(false);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.2fr auto", gap:".5rem", alignItems:"end", background:"#f4f9ef", border:"1px solid #b8d98a", borderRadius:"6px", padding:".6rem .8rem", marginBottom:".5rem" }}>
      <div><label style={s.lbl}>Conteúdo / Disciplina</label><input style={s.inp} value={c.nome} onChange={e=>onChange({...c,nome:e.target.value})} placeholder="Ex: Direito Constitucional"/></div>
      <div><label style={s.lbl}>Qtd</label><input type="number" style={{...s.inp,maxWidth:"80px",textAlign:"center"}} value={c.qtd} min={1} max={20} onChange={e=>onChange({...c,qtd:parseInt(e.target.value)||1})}/></div>
      <div><label style={s.lbl}>Tipo</label>
        <select style={s.inp} value={c.tipo} onChange={e=>onChange({...c,tipo:e.target.value as "objetiva"|"discursiva"})}>
          <option value="objetiva">Objetiva</option><option value="discursiva">Discursiva</option>
        </select>
      </div>
      <div style={{ alignSelf:"flex-end" }}><button style={s.bdxs} onClick={onRemove}>✕</button></div>
      <div style={{ gridColumn:"1/-1" }}>
        <button style={{ background:"none", border:"none", color:C.vm, fontSize:".75rem", cursor:"pointer", padding:".1rem 0" }} onClick={()=>setShowTB(p=>!p)}>
          📎 Texto base (opcional) {showTB?"▴":"▾"}
        </button>
        {showTB && <div style={{ marginTop:".3rem" }}>
          <label style={s.lbl}>Texto base</label>
          <textarea style={{...s.inp,minHeight:"70px",resize:"vertical"}} value={c.texto} onChange={e=>onChange({...c,texto:e.target.value})} placeholder="Cole aqui o texto base para as questões..." />
        </div>}
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }:{ title:string; onClose?:()=>void; children:React.ReactNode }) {
  return (
    <div onClick={e=>{ if(e.target===e.currentTarget&&onClose) onClose(); }} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div style={{ background:"#fff", borderRadius:"10px", border:"1px solid #b8d98a", width:"100%", maxWidth:"760px", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 8px 40px rgba(0,0,0,.25)" }}>
        <div style={{ background:"linear-gradient(135deg,#000,#0d2a05)", padding:".9rem 1.2rem", borderRadius:"10px 10px 0 0", borderBottom:"1px solid #2a5a00", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:1 }}>
          <span style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{title}</span>
          {onClose && <button onClick={onClose} style={{ background:"none", border:"none", color:"#86EFAC", fontSize:"1.3rem", cursor:"pointer" }}>✕</button>}
        </div>
        <div style={{ padding:"1.2rem" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Config Modal ─────────────────────────────────────────────────────────────
function ConfigModal({ prova, onSave, onClose }:{ prova:Prova; onSave:(c:Config)=>void; onClose:()=>void }) {
  const [cfg, setCfg] = useState<Config>({...prova.config, conteudos:[...prova.config.conteudos.map(c=>({...c}))]});
  const totalDif = Object.values(cfg.dif).reduce((a,b)=>a+b,0);
  const addCont = () => { const id=cfg.nextContId; setCfg(p=>({...p, nextContId:p.nextContId+1, conteudos:[...p.conteudos,{id,nome:"",qtd:1,tipo:"objetiva",texto:""}]})); };
  const updCont = (id:number,u:Conteudo) => setCfg(p=>({...p,conteudos:p.conteudos.map(c=>c.id===id?u:c)}));
  const remCont = (id:number) => { if(cfg.conteudos.length<=1)return; setCfg(p=>({...p,conteudos:p.conteudos.filter(c=>c.id!==id)})); };
  const save = () => {
    if(totalDif!==100){alert("A dificuldade precisa somar 100%.");return;}
    if(!cfg.titulo.trim()){alert("Informe o nome do documento.");return;}
    if(!cfg.conteudos.some(c=>c.nome.trim())){alert("Adicione ao menos um conteúdo com nome.");return;}
    onSave(cfg);
  };
  const modFields:[keyof Modelos,string][] = [["direta","Objetiva Direta"],["assertivas","Assertivas"],["vf","V ou F"],["lacunas","Lacunas"],["colunas","Colunas"],["ar","Asserção/Razão"],["ordem","Ordenação"]];
  return (
    <Modal title={`⚙️ Configurar: ${prova.nome}`} onClose={onClose}>
      <SecTitle>📄 Identificação</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".8rem", marginBottom:".8rem" }}>
        <div><label style={s.lbl}>Nome do documento</label><input style={s.inp} value={cfg.titulo} onChange={e=>setCfg(p=>({...p,titulo:e.target.value}))} placeholder="Ex: Prova TJ/ES 2025"/></div>
        <div><label style={s.lbl}>Nível escolar</label>
          <select style={s.inp} value={cfg.nivel} onChange={e=>setCfg(p=>({...p,nivel:e.target.value}))}>
            <option value="Fundamental">Fundamental</option><option value="Médio">Médio</option><option value="Superior">Superior</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom:".8rem", maxWidth:"240px" }}>
        <label style={s.lbl}>Nº de alternativas</label>
        <select style={s.inp} value={cfg.nAlt} onChange={e=>setCfg(p=>({...p,nAlt:parseInt(e.target.value)}))}>
          <option value={4}>4 alternativas</option><option value={5}>5 alternativas</option>
        </select>
      </div>
      <HR/>
      <SecTitle>📊 Distribuição de Dificuldade</SecTitle>
      <DifGrid dif={cfg.dif} onChange={d=>setCfg(p=>({...p,dif:d}))}/>
      <HR/>
      <SecTitle>🎲 Modelos de Questão (objetivas)</SecTitle>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:".5rem", marginBottom:".4rem" }}>
        {modFields.map(([k,l])=>(
          <div key={k}>
            <label style={{ fontSize:".70rem", fontWeight:700, color:C.vd, display:"block", marginBottom:".25rem" }}>{l}</label>
            <input type="number" style={{...s.inp,textAlign:"center"}} value={cfg.modelos[k]} min={0} onChange={e=>setCfg(p=>({...p,modelos:{...p.modelos,[k]:parseInt(e.target.value)||0}}))}/>
          </div>
        ))}
      </div>
      <p style={{ fontSize:".74rem", color:"#166534", marginBottom:".8rem" }}>Distribuição proporcional às objetivas. Discursivas não usam modelos.</p>
      <HR/>
      <SecTitle>📚 Conteúdos e Quantidades</SecTitle>
      {cfg.conteudos.map(c=><ConteudoRow key={c.id} c={c} onChange={u=>updCont(c.id,u)} onRemove={()=>remCont(c.id)}/>)}
      <button style={{...s.bs,fontSize:".75rem",marginBottom:".8rem"}} onClick={addCont}>＋ Adicionar Conteúdo</button>
      <HR/>
      <SecTitle>💬 Instrução Adicional (opcional)</SecTitle>
      <textarea style={{...s.inp,resize:"vertical"}} rows={3} value={cfg.instrucao} onChange={e=>setCfg(p=>({...p,instrucao:e.target.value}))} placeholder="Ex: Foque nos arts. 5 ao 37 da CF/88."/>
      <HR/>
      <div style={{ display:"flex", gap:".7rem", justifyContent:"flex-end" }}>
        <button style={s.bs} onClick={onClose}>Cancelar</button>
        <button style={s.bp} onClick={save}>💾 Salvar Configuração</button>
      </div>
    </Modal>
  );
}

// ─── Gerar Modal ─────────────────────────────────────────────────────────────
function GerarModal({ prova, onGeradas, onClose }:{ prova:Prova; onGeradas:(qs:Questao[])=>void; onClose:()=>void }) {
  const [status, setStatus] = useState("");
  const [pct, setPct] = useState(0);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const cfg = prova.config;
  const conts = cfg.conteudos.filter(c=>c.nome.trim());
  const total = conts.reduce((s,c)=>s+c.qtd,0);

  const gerar = async () => {
    setGerando(true); setErro(""); setPct(0);
    const difStr = `Muito Facil ${cfg.dif.mfacil}%, Facil ${cfg.dif.facil}%, Medio ${cfg.dif.medio}%, Dificil ${cfg.dif.dificil}%, Muito Dificil ${cfg.dif.mdificil}%`;
    const modStr = `Objetiva Direta:${cfg.modelos.direta}, Assertivas:${cfg.modelos.assertivas}, VF:${cfg.modelos.vf}, Lacunas:${cfg.modelos.lacunas}, Colunas:${cfg.modelos.colunas}, AR:${cfg.modelos.ar}, Ordem:${cfg.modelos.ordem}`;
    const fila: Conteudo[] = [];
    conts.forEach(c=>{ for(let i=0;i<c.qtd;i++) fila.push({...c,qtd:1}); });
    const LOTE=2, lotesTot=Math.ceil(fila.length/LOTE);
    let numAt = prova.questoes.length+1, nextId = Date.now();
    const geradas: Questao[] = [];

    for(let i=0; i<fila.length; i+=LOTE) {
      const lote = fila.slice(i,i+LOTE);
      const loteAt = Math.floor(i/LOTE)+1;
      setPct(Math.round((loteAt-1)/lotesTot*100));
      setStatus(`Gerando lote ${loteAt} de ${lotesTot}...`);
      const contsStr = lote.map(c=>`${c.nome}: ${c.qtd} questao(oes) [${c.tipo}]`).join("\n");
      const txtStr = lote.filter(c=>c.texto).map(c=>`Texto base para '${c.nome}':\n${c.texto}`).join("\n\n");
      const nLote = lote.reduce((s,c)=>s+c.qtd,0);
      const prompt = `Gere exatamente ${nLote} questao(oes) inedita(s) de concurso publico.\nTitulo: ${cfg.titulo}\nNivel: ${cfg.nivel}\nDificuldade: ${difStr}\nModelos (objetivas): ${modStr}\nConteudos:\n${contsStr}${txtStr?"\nTextos base:\n"+txtStr:""}${cfg.instrucao?"\nInstrucao adicional: "+cfg.instrucao:""}\nNumere a partir de ${numAt}.\nCada objetiva: exatamente ${cfg.nAlt} alternativas. Defesa completa com justificativas de todos os distratores.`;
      try {
        const texto = await callAPI(getSP(cfg.nAlt), prompt, 8000);
        const novas = parseQs(texto);
        novas.forEach((q,idx)=>{ geradas.push({...q, id:nextId++, numero:String(numAt+idx), aprovada:false, diagnostico:null}); });
        numAt += nLote;
      } catch(e:unknown) {
        setErro("Erro no lote "+loteAt+": "+(e instanceof Error?e.message:String(e)));
      }
    }
    setPct(100); setStatus(`✅ ${geradas.length} questão(ões) gerada(s)!`);
    setGerando(false);
    setTimeout(()=>{ onGeradas(geradas); onClose(); }, 900);
  };

  return (
    <Modal title={`🚀 Gerar Questões: ${prova.nome}`} onClose={!gerando?onClose:undefined}>
      <Alert type="in">
        <strong>Configuração:</strong><br/>
        Nível: {cfg.nivel} · {cfg.nAlt} alternativas · Claude Opus<br/>
        Conteúdos: {conts.map(c=>`${c.nome} (${c.qtd} ${c.tipo})`).join(", ")}<br/>
        Total: <strong>{total} questão(ões)</strong>
      </Alert>
      {erro && <Alert type="er">{erro}</Alert>}
      {(gerando||pct>0) && (
        <div style={{ marginBottom:"1rem" }}>
          <div style={{ background:"#e8f4d8", border:"1px solid #b8d98a", borderRadius:"99px", height:"8px", overflow:"hidden", margin:".5rem 0" }}>
            <div style={{ height:"100%", background:"linear-gradient(90deg,#1a4a00,#4a8a00)", borderRadius:"99px", width:pct+"%", transition:"width .4s" }}/>
          </div>
          <div style={{ fontSize:".78rem", color:"#166534" }}>{status}</div>
        </div>
      )}
      <div style={{ display:"flex", gap:".7rem", justifyContent:"flex-end" }}>
        {!gerando && <button style={s.bs} onClick={onClose}>Cancelar</button>}
        <button style={{ ...s.bp, opacity:gerando?.7:1 }} onClick={gerar} disabled={gerando}>
          {gerando ? <><Spinner/>Gerando...</> : `🚀 Gerar ${total} Questão(ões)`}
        </button>
      </div>
    </Modal>
  );
}

// ─── Questão Card ─────────────────────────────────────────────────────────────
function QuestaoCard({ q, cfg, onUpdate, onRemove }:{ q:Questao; cfg:Config; onUpdate:(q:Questao)=>void; onRemove:()=>void }) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editCorpo, setEditCorpo] = useState(q.corpo);
  const [editDefesa, setEditDefesa] = useState(q.defesa);
  const [loading, setLoading] = useState<string|null>(null);

  const rc = q.diagnostico?.risco;
  const rcEmoji:{[k:string]:string} = { GRAVE:"🔴", MODERADO:"🟠", LEVE:"🟡", INEXISTENTE:"✅" };
  const lbl = `Questão ${q.numero} — ${q.conteudo} ${rcEmoji[rc||""]||""}`;

  const RiscoBadge = () => {
    if(q.aprovada) return <span style={{ background:"#e8f4d8", color:"#1a3d00", borderRadius:"20px", padding:".12rem .5rem", fontSize:".68rem", fontWeight:700, border:"1px solid #4a8a00" }}>Aprovada</span>;
    const map:{[k:string]:[string,string]} = { GRAVE:["#fff0ee","#cc2200"], MODERADO:["#fffbe0","#6b4a00"], LEVE:["#eef8e0","#2a5a00"], INEXISTENTE:["#e8f4d8","#1a3d00"] };
    if(!rc) return <span style={{ background:"#fffbe0", color:"#6b4a00", borderRadius:"20px", padding:".12rem .5rem", fontSize:".68rem", fontWeight:700, border:"1px solid #e0cc60" }}>Pendente</span>;
    const [bg,col] = map[rc]||["#fffbe0","#6b4a00"];
    return <span style={{ background:bg, color:col, borderRadius:"20px", padding:".12rem .5rem", fontSize:".68rem", fontWeight:700 }}>{rc}</span>;
  };

  const DIAG_SYS = 'Especialista em questoes de concurso. Retorne SOMENTE JSON:\n{"questoes":[{"numero":"1","problemas":["problema"],"risco":"INEXISTENTE","justificativa_risco":"Breve.","instrucao_reescrita":""}]}\nRiscos: INEXISTENTE, LEVE, MODERADO, GRAVE.';

  const diagQ = async () => {
    setLoading("diag");
    try {
      let raw = await callAPI(DIAG_SYS, `Analise:\n\n=== QUESTAO ${q.numero} (${q.conteudo}) ===\n${q.corpo}\n--- DEFESA ---\n${q.defesa}`, 2000);
      raw = raw.replace(/```json|```/g,"").trim();
      const idx = raw.indexOf("{"); if(idx>0) raw=raw.slice(idx);
      const parsed = JSON.parse(raw);
      onUpdate({...q, diagnostico: parsed.questoes?.[0]||null});
    } catch(e:unknown) { alert("Erro diagnóstico: "+(e instanceof Error?e.message:String(e))); }
    setLoading(null);
  };

  const corrigirQ = async () => {
    if(!q.diagnostico?.problemas?.length){alert("Execute o Diagnóstico primeiro.");return;}
    setLoading("corrigir");
    const listaErros = "ERROS:\n"+q.diagnostico.problemas.map((p,i)=>`${i+1}. ${p}`).join("\n")+(q.diagnostico.instrucao_reescrita?"\nINSTRUCAO: "+q.diagnostico.instrucao_reescrita:"");
    const questaoTxt = q.corpo+(q.defesa?"\n"+q.defesa:"");
    try {
      const plano = await callAPI("", `Revisor especialista. Plano de correcao cirurgico.\nQUESTAO (${q.conteudo} - n.${q.numero}):\n${questaoTxt}\n\n${listaErros}\n\nFormato:\nERRO 1: [desc]\nTRECHO ORIGINAL: "..."\nNOVO TRECHO: "..."\nTermine com: ELEMENTOS PRESERVADOS: [lista]`, 1500);
      const corr = await callAPI(getSP(cfg.nAlt), `Execute o plano EXATAMENTE. Questao COMPLETA com ${cfg.nAlt} alternativas e defesa completa.\nQUESTAO ORIGINAL:\n${questaoTxt}\n\nPLANO:\n${plano}\n\nComece com: ${q.conteudo}\n${q.numero}. [enunciado]`, 4000);
      const novas = parseQs(corr);
      if(novas.length) { onUpdate({...q, corpo:novas[0].corpo, defesa:novas[0].defesa, aprovada:false, diagnostico:null}); }
      else { const pts=corr.split(/\nDefesa:/i); onUpdate({...q, corpo:pts[0].trim(), defesa:pts.length>1?"Defesa:\n"+pts.slice(1).join("\nDefesa:").trim():"", aprovada:false, diagnostico:null}); }
    } catch(e:unknown) { alert("Erro correção: "+(e instanceof Error?e.message:String(e))); }
    setLoading(null);
  };

  const regerarQ = async () => {
    setLoading("regerar");
    const difStr=`Muito Facil ${cfg.dif.mfacil}%, Facil ${cfg.dif.facil}%, Medio ${cfg.dif.medio}%, Dificil ${cfg.dif.dificil}%, Muito Dificil ${cfg.dif.mdificil}%`;
    const instr = q.diagnostico?.instrucao_reescrita?"\nInstrucao: "+q.diagnostico.instrucao_reescrita:"";
    try {
      const txt = await callAPI(getSP(cfg.nAlt), `Gere 1 questao inedita.\nTitulo: ${cfg.titulo}\nNivel: ${cfg.nivel}, Dificuldade: ${difStr}\nConteudo: ${q.conteudo}, Numero: ${q.numero}${instr}\nExatamente ${cfg.nAlt} alternativas. Defesa completa.`, 5000);
      const novas = parseQs(txt);
      if(novas.length) onUpdate({...q, corpo:novas[0].corpo, defesa:novas[0].defesa, aprovada:false, diagnostico:null});
    } catch(e:unknown) { alert("Erro ao regerar: "+(e instanceof Error?e.message:String(e))); }
    setLoading(null);
  };

  const rcMap:{[k:string]:React.CSSProperties} = {
    INEXISTENTE:{ background:"#e8f4d8", color:"#1a3d00", border:"1px solid #b8d98a" },
    LEVE:{ background:"#eef8e0", color:"#2a5a00", border:"1px solid #a0cc60" },
    MODERADO:{ background:"#fffbe0", color:"#6b4a00", border:"1px solid #e0cc60" },
    GRAVE:{ background:"#fff0ee", color:"#cc2200", border:"1px solid #ffaaaa" },
  };

  return (
    <div style={{ border:"1px solid #b8d98a", borderRadius:"8px", marginBottom:".7rem", overflow:"hidden", boxShadow:"0 2px 8px rgba(60,120,0,0.10)" }}>
      <div onClick={()=>setOpen(p=>!p)} style={{ background:"linear-gradient(90deg,#000,#0a2500 40%,#0d3000)", padding:".45rem .9rem", borderBottom:"1px solid #2a5a00", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
        <span style={{ color:"#fff", fontWeight:700, fontSize:".82rem" }}>{lbl}</span>
        <div style={{ display:"flex", gap:".4rem", alignItems:"center" }}><RiscoBadge/><span style={{ color:"#86EFAC", fontSize:".85rem" }}>{open?"▴":"▾"}</span></div>
      </div>
      {open && (
        <div style={{ padding:".9rem 1rem", background:"#fff" }}>
          {/* 6 ações */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:".35rem", marginBottom:".7rem" }}>
            <button style={{...s.bs,fontSize:".73rem",justifyContent:"center",display:"flex",alignItems:"center",gap:".2rem"}} onClick={()=>{setEditMode(p=>!p);setEditCorpo(q.corpo);setEditDefesa(q.defesa);}}>✏️ Editar</button>
            <button style={{...s.bs,fontSize:".73rem",justifyContent:"center",display:"flex",alignItems:"center",gap:".2rem"}} onClick={diagQ} disabled={!!loading}>{loading==="diag"?<><Spinner/>Analisando</>:"🔬 Diagnóstico"}</button>
            <button style={{...s.bs,fontSize:".73rem",justifyContent:"center",display:"flex",alignItems:"center",gap:".2rem"}} onClick={corrigirQ} disabled={!!loading}>{loading==="corrigir"?<><Spinner/>Corrigindo</>:"🔧 Corrigir"}</button>
            <button style={{...(q.aprovada?s.bp:s.bs),fontSize:".73rem",justifyContent:"center",display:"flex",alignItems:"center",gap:".2rem"}} onClick={()=>onUpdate({...q,aprovada:!q.aprovada})}>{q.aprovada?"✓ Aprovada":"Aprovar"}</button>
            <button style={{...s.bs,fontSize:".73rem",justifyContent:"center",display:"flex",alignItems:"center",gap:".2rem"}} onClick={regerarQ} disabled={!!loading}>{loading==="regerar"?<><Spinner/>Regerando</>:"🔄 Regerar"}</button>
            <button style={{...s.bd,fontSize:".73rem",justifyContent:"center",display:"flex",alignItems:"center",gap:".2rem"}} onClick={onRemove}>🗑 Excluir</button>
          </div>
          {/* Diagnóstico box */}
          {q.diagnostico && (
            <div style={{ fontSize:".78rem", borderRadius:"6px", padding:".5rem .8rem", marginBottom:".5rem", lineHeight:1.5, ...rcMap[q.diagnostico.risco]||{} }}>
              <strong>Risco: {q.diagnostico.risco}</strong> — {q.diagnostico.justificativa_risco}
              {q.diagnostico.problemas?.length>0 && <><br/><em>Problemas:</em> {q.diagnostico.problemas.join("; ")}</>}
            </div>
          )}
          {/* Corpo / Editor */}
          {editMode ? (
            <div>
              <label style={s.lbl}>Corpo da questão</label>
              <textarea style={{...s.inp,minHeight:"200px",resize:"vertical",marginBottom:".5rem",whiteSpace:"pre-wrap"}} value={editCorpo} onChange={e=>setEditCorpo(e.target.value)}/>
              <label style={s.lbl}>Defesa / Gabarito comentado</label>
              <textarea style={{...s.inp,minHeight:"140px",resize:"vertical",marginBottom:".5rem",whiteSpace:"pre-wrap"}} value={editDefesa} onChange={e=>setEditDefesa(e.target.value)}/>
              <div style={{ display:"flex", gap:".5rem" }}>
                <button style={s.bp} onClick={()=>{onUpdate({...q,corpo:editCorpo,defesa:editDefesa});setEditMode(false);}}>💾 Salvar</button>
                <button style={s.bs} onClick={()=>setEditMode(false)}>✕ Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:".87rem", lineHeight:1.7, whiteSpace:"pre-wrap", color:"#1a3d00", background:"#f4f9ef", border:"1px solid #b8d98a", borderRadius:"6px", padding:".8rem 1rem", marginBottom:".6rem" }}>{q.corpo}</div>
              {q.defesa && (
                <details>
                  <summary style={{ cursor:"pointer", fontSize:".78rem", fontWeight:700, color:"#1a3d00", padding:".3rem .5rem", background:"#e8f4d8", borderRadius:"6px", border:"1px solid #b8d98a" }}>Defesa / Gabarito Comentado</summary>
                  <div style={{ background:"#f4f9ef", border:"1px solid #b8d98a", borderRadius:"6px", padding:".8rem 1rem", fontSize:".82rem", lineHeight:1.65, color:"#2a5a00", whiteSpace:"pre-wrap", marginTop:".3rem" }}>{q.defesa}</div>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Prova Card ───────────────────────────────────────────────────────────────
let _provId=100;
function ProvaCard({ prova, onUpdate, onDelete }:{ prova:Prova; onUpdate:(p:Prova)=>void; onDelete:()=>void }) {
  const [open,setOpen]=useState(false);
  const [showCfg,setShowCfg]=useState(false);
  const [showGerar,setShowGerar]=useState(false);
  const cfg=prova.config;
  const ok=cfg.titulo&&cfg.conteudos.some(c=>c.nome.trim())&&Object.values(cfg.dif).reduce((a,b)=>a+b,0)===100;
  const nq=prova.questoes.length, nap=prova.questoes.filter(q=>q.aprovada).length;
  const updQ=(u:Questao)=>onUpdate({...prova,questoes:prova.questoes.map(q=>q.id===u.id?u:q)});
  const remQ=(id:number)=>{ if(!confirm("Excluir esta questão?"))return; onUpdate({...prova,questoes:prova.questoes.filter(q=>q.id!==id)}); };
  return (
    <div style={{ background:"#fff", border:"1px solid #b8d98a", borderRadius:"8px", marginBottom:".7rem", overflow:"hidden" }}>
      {showCfg&&<ConfigModal prova={prova} onSave={c=>{onUpdate({...prova,config:c});setShowCfg(false);}} onClose={()=>setShowCfg(false)}/>}
      {showGerar&&<GerarModal prova={prova} onGeradas={qs=>onUpdate({...prova,questoes:[...prova.questoes,...qs]})} onClose={()=>setShowGerar(false)}/>}
      <div onClick={()=>setOpen(p=>!p)} style={{ background:"#e8f4d8", padding:".5rem .9rem", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", borderBottom:"1px solid #b8d98a" }}>
        <div style={{ display:"flex", alignItems:"center", gap:".4rem", flexWrap:"wrap" }}>
          <span style={{ fontWeight:700, fontSize:".84rem", color:C.vd }}>📝 {prova.nome}</span>
          <span style={{ borderRadius:"99px", padding:"1px 7px", fontSize:".68rem", fontWeight:700, background:ok?"#e8f4d8":"#fffbe0", color:ok?"#1a3d00":"#6b4a00" }}>{ok?"ok":"config"}</span>
          {nq>0&&<Tag>{nq} Q · {nap} aprov.</Tag>}
        </div>
        <div style={{ display:"flex", gap:".35rem", alignItems:"center" }} onClick={e=>e.stopPropagation()}>
          <button style={s.bxs} onClick={()=>setShowCfg(true)}>⚙️ Config</button>
          <button onClick={()=>{if(ok)setShowGerar(true);}} disabled={!ok} style={{...s.bxs,background:ok?"linear-gradient(135deg,#14532D,#16A34A)":"#9CA3AF",color:"#fff",border:"none",opacity:ok?1:.7}}>🚀 Gerar</button>
          <button style={s.bxs} onClick={()=>{const n=prompt("Novo nome:",prova.nome);if(n?.trim())onUpdate({...prova,nome:n.trim()});}}>✏️</button>
          <button style={s.bdxs} onClick={()=>{if(confirm("Excluir prova?"))onDelete();}}>🗑</button>
          <span style={{ color:C.vm }}>{open?"▴":"▾"}</span>
        </div>
      </div>
      {open&&(
        <div style={{ padding:".8rem 1rem", background:"#f4f9ef" }}>
          {prova.questoes.length>0&&(
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:".4rem", marginBottom:".7rem" }}>
              <span style={{ fontSize:".78rem", color:"#166534" }}>{nq} questão(ões) · {nap} aprovada(s)</span>
              <div style={{ display:"flex", gap:".35rem", flexWrap:"wrap" }}>
                <button style={s.bxs} onClick={()=>onUpdate({...prova,questoes:prova.questoes.map(q=>({...q,aprovada:true}))})}>✅ Aprovar Todas</button>
                <button style={s.bdxs} onClick={()=>{if(confirm("Remover todas as questões?"))onUpdate({...prova,questoes:[]});}}>🗑 Limpar</button>
              </div>
            </div>
          )}
          {prova.questoes.length===0
            ?<div style={{ color:"#6B7280", fontSize:".82rem", padding:".3rem 0" }}>Nenhuma questão. Clique em 🚀 Gerar.</div>
            :prova.questoes.map(q=><QuestaoCard key={q.id} q={q} cfg={cfg} onUpdate={updQ} onRemove={()=>remQ(q.id)}/>)
          }
        </div>
      )}
    </div>
  );
}

// ─── Projeto Card ─────────────────────────────────────────────────────────────
let _projId=1;
function ProjetoCard({ projeto, onUpdate, onDelete }:{ projeto:Projeto; onUpdate:(p:Projeto)=>void; onDelete:()=>void }) {
  const [open,setOpen]=useState(true);
  const nq=projeto.provas.reduce((s,v)=>s+v.questoes.length,0);
  const defCfg=():Config=>({titulo:"",nivel:"Superior",nAlt:5,dif:{mfacil:0,facil:0,medio:0,dificil:0,mdificil:0},modelos:{direta:0,assertivas:0,vf:0,lacunas:0,colunas:0,ar:0,ordem:0},conteudos:[{id:1,nome:"",qtd:1,tipo:"objetiva",texto:""}],instrucao:"",nextContId:2});
  const addProva=()=>{ const n=prompt("Nome da prova:");if(!n?.trim())return; onUpdate({...projeto,provas:[...projeto.provas,{id:_provId++,nome:n.trim(),config:defCfg(),questoes:[]}]}); };
  const updP=(vid:number,u:Prova)=>onUpdate({...projeto,provas:projeto.provas.map(v=>v.id===vid?u:v)});
  const delP=(vid:number)=>{ if(!confirm("Excluir prova?"))return; onUpdate({...projeto,provas:projeto.provas.filter(v=>v.id!==vid)}); };
  return (
    <div style={{ background:"#fff", border:"1.5px solid #4a8a00", borderRadius:"8px", marginBottom:"1rem", overflow:"hidden", boxShadow:"0 2px 10px rgba(60,120,0,0.10)" }}>
      <div onClick={()=>setOpen(p=>!p)} style={{ background:"linear-gradient(90deg,#000,#0a2500 40%,#0d3000)", padding:".6rem 1rem", borderBottom:"1px solid #2a5a00", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap" }}>
          <span style={{ color:"#fff", fontWeight:700, fontSize:".9rem" }}>📁 {projeto.nome}</span>
          <Tag>{projeto.provas.length} prova(s)</Tag>
          {nq>0&&<Tag>{nq} Q</Tag>}
        </div>
        <div style={{ display:"flex", gap:".4rem", alignItems:"center" }} onClick={e=>e.stopPropagation()}>
          <button style={{...s.bxs,color:"#fff",border:"1px solid #86EFAC",background:"rgba(255,255,255,.1)"}} onClick={()=>{const n=prompt("Novo nome:",projeto.nome);if(n?.trim())onUpdate({...projeto,nome:n.trim()});}}>✏️</button>
          <button style={{...s.bdxs,border:"1px solid #FCA5A5",background:"rgba(255,255,255,.1)",color:"#FCA5A5"}} onClick={()=>{if(confirm("Excluir projeto e tudo dentro?"))onDelete();}}>🗑</button>
          <span style={{ color:"#86EFAC" }}>{open?"▴":"▾"}</span>
        </div>
      </div>
      {open&&(
        <div style={{ padding:".8rem 1rem" }}>
          {projeto.provas.length===0?<div style={{ color:"#6B7280", fontSize:".83rem", padding:".4rem 0" }}>Sem provas. Crie uma abaixo.</div>
            :projeto.provas.map(v=><ProvaCard key={v.id} prova={v} onUpdate={u=>updP(v.id,u)} onDelete={()=>delP(v.id)}/>)
          }
          <button style={{...s.bs,fontSize:".78rem",marginTop:".3rem"}} onClick={addProva}>＋ Nova Prova</button>
        </div>
      )}
    </div>
  );
}

// ─── Exportar Tab ─────────────────────────────────────────────────────────────
function ExportarTab({ projetos }:{ projetos:Projeto[] }) {
  const [soAp,setSoAp]=useState(true);
  const [comDef,setComDef]=useState(true);
  const [agrup,setAgrup]=useState(true);
  const [sel,setSel]=useState<{[k:string]:boolean}>({});
  const provasComQs = projetos.flatMap(p=>p.provas.filter(v=>v.questoes.length>0).map(v=>({pid:p.id,vid:v.id,pnome:p.nome,vnome:v.nome,nq:v.questoes.length,nap:v.questoes.filter(q=>q.aprovada).length})));
  const isSel=(pid:number,vid:number)=>sel[`${pid}-${vid}`]!==false;
  const getQs=()=>{ const qs:{corpo:string;defesa:string;_pnome:string;_vnome:string;_titulo:string}[]=[]; projetos.forEach(p=>p.provas.forEach(v=>{ if(!v.questoes.length||!isSel(p.id,v.id))return; (soAp?v.questoes.filter(q=>q.aprovada):v.questoes).forEach(q=>qs.push({...q,_pnome:p.nome,_vnome:v.nome,_titulo:v.config.titulo})); })); return qs; };
  const rtfE=(s:string)=>s.replace(/\\/g,"\\\\").replace(/\{/g,"\\{").replace(/\}/g,"\\}").replace(/[^\x00-\x7F]/g,c=>`\\u${c.charCodeAt(0)}?`);
  const expRtf=()=>{ const qs=getQs();if(!qs.length){alert("Nenhuma questão para exportar.");return;} let rtf="{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Arial;}}\n{\\colortbl;\\red20\\green83\\blue45;}\n\\f0\\fs24\n{\\b\\fs32\\cf1 ELABORA - QUESTOES DE CONCURSO}\\par\\par\n"; let last=""; qs.forEach(q=>{ const g=q._pnome+"|"+q._vnome; if(agrup&&g!==last){rtf+=`\\par{\\b\\fs26\\cf1 ${rtfE(q._pnome)} > ${rtfE(q._vnome)}}\\par`+(q._titulo?`{\\i ${rtfE(q._titulo)}}\\par`:"")+`\\par\n`;last=g;} rtf+=rtfE(q.corpo).replace(/\n/g,"\\par\n")+"\\par\\par\n"; if(comDef&&q.defesa){rtf+="{\\i\\cf1 --- DEFESA ---}\\par\n"+rtfE(q.defesa).replace(/\n/g,"\\par\n")+"\\par\\par\\par\n";} rtf+="\\par\n"; }); rtf+="}"; const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([rtf],{type:"application/rtf"}));a.download="elabora_questoes.rtf";a.click(); };
  const expTxt=()=>{ const qs=getQs();if(!qs.length){alert("Nenhuma questão para exportar.");return;} let txt="ELABORA - QUESTOES DE CONCURSO\n"+"=".repeat(60)+"\n\n",last=""; qs.forEach(q=>{ const g=q._pnome+"|"+q._vnome; if(agrup&&g!==last){txt+="\n"+"-".repeat(50)+"\nProjeto: "+q._pnome+" | Prova: "+q._vnome+(q._titulo?" | "+q._titulo:"")+"\n"+"-".repeat(50)+"\n\n";last=g;} txt+=q.corpo+"\n";if(comDef&&q.defesa)txt+="\n"+q.defesa+"\n";txt+="\n\n\n"; }); const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type:"text/plain;charset=utf-8"}));a.download="elabora_questoes.txt";a.click(); };
  return (
    <div style={{ padding:"1.2rem 1.5rem", maxWidth:"1200px", color:"#1a3d00" }}>
      <SecTitle>📤 Exportar Questões</SecTitle>
      <div style={s.card}>
        {provasComQs.length===0?<Alert type="in">Gere questões para exportar.</Alert>:<Alert type="ok">Selecione as provas e clique em Exportar.</Alert>}
        <div style={{ display:"flex", gap:".8rem", flexWrap:"wrap" }}>
          <button style={s.bp} onClick={expRtf} disabled={!provasComQs.length}>📄 Baixar .rtf (abre no Word)</button>
          <button style={s.bs} onClick={expTxt} disabled={!provasComQs.length}>📝 Baixar .txt</button>
        </div>
        <p style={{ fontSize:".74rem", color:"#166534", marginTop:".5rem" }}>💡 O .rtf abre direto no Word — salve como .docx.</p>
      </div>
      <div style={s.card}>
        <SecTitle>⚙️ Opções</SecTitle>
        <label style={{ display:"flex", alignItems:"center", gap:".5rem", cursor:"pointer", fontWeight:500 }}><input type="checkbox" checked={comDef} onChange={e=>setComDef(e.target.checked)}/> Incluir defesa/gabarito comentado</label>
        <label style={{ display:"flex", alignItems:"center", gap:".5rem", cursor:"pointer", fontWeight:500, marginTop:".5rem" }}><input type="checkbox" checked={soAp} onChange={e=>setSoAp(e.target.checked)}/> Exportar apenas questões aprovadas</label>
        <label style={{ display:"flex", alignItems:"center", gap:".5rem", cursor:"pointer", fontWeight:500, marginTop:".5rem" }}><input type="checkbox" checked={agrup} onChange={e=>setAgrup(e.target.checked)}/> Agrupar por projeto/prova</label>
      </div>
      {provasComQs.length>0&&<div style={s.card}>
        <SecTitle>🗂️ Selecionar Provas</SecTitle>
        {provasComQs.map(r=><label key={`${r.pid}-${r.vid}`} style={{ display:"flex", alignItems:"center", gap:".5rem", cursor:"pointer", fontWeight:500, marginBottom:".4rem" }}>
          <input type="checkbox" checked={isSel(r.pid,r.vid)} onChange={()=>setSel(p=>({...p,[`${r.pid}-${r.vid}`]:!isSel(r.pid,r.vid)}))}/> <strong>{r.pnome}</strong> › {r.vnome} <Tag>{r.nq} Q · {r.nap} aprov.</Tag>
        </label>)}
      </div>}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("projetos");
  const [projetos,setProjetos]=useState<Projeto[]>([]);
  const addProj=()=>{ const n=prompt("Nome do projeto:");if(!n?.trim())return; setProjetos(p=>[...p,{id:_projId++,nome:n.trim(),provas:[]}]); };
  const updProj=(id:number,u:Projeto)=>setProjetos(p=>p.map(proj=>proj.id===id?u:proj));
  const delProj=(id:number)=>{ if(!confirm("Excluir projeto e tudo dentro?"))return; setProjetos(p=>p.filter(proj=>proj.id!==id)); };
  const TabBtn=({id,label}:{id:string;label:string})=>(
    <button onClick={()=>setTab(id)} style={{ padding:".6rem 1.6rem", fontSize:".82rem", fontWeight:600, cursor:"pointer", borderBottom:tab===id?"3px solid #7DC900":"3px solid transparent", borderTop:"none", borderLeft:"none", borderRight:"none", color:tab===id?"#CCFF33":"#5a8a20", background:"none", fontFamily:"inherit", whiteSpace:"nowrap" as const, letterSpacing:".08em", textTransform:"uppercase" as const, transition:"color .2s" }}>
      {label}
    </button>
  );
  return (
    <div style={{ fontFamily:"'Segoe UI',Arial,sans-serif", background:"#f4f9ef", minHeight:"100vh", color:"#1a3d00" }}>
      <div style={{ background:"linear-gradient(135deg,#000000 0%,#0a1f0a 30%,#0d2e0d 60%,#000000 100%)", padding:".65rem 1.5rem", border:"2px solid #3a7a00", borderLeft:"none", borderRight:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(100,220,50,0.15), 0 0 18px rgba(80,180,0,0.18)", display:"flex", alignItems:"center", gap:"1rem" }}>
        <img src="/Logo_Elabora.png" alt="Elabora" style={{ height:"64px", width:"64px", objectFit:"contain", flexShrink:0 }} />
        <p style={{ fontSize:"1.6rem", fontWeight:900, letterSpacing:".04em", margin:0, lineHeight:1, whiteSpace:"nowrap" as const, background:"linear-gradient(180deg, #CCFF33 0%, #7DC900 35%, #4A8A00 65%, #2E5500 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}>
          Soluções Pedagógicas
        </p>
      </div>
      <div style={{ height:"6px", background:"linear-gradient(90deg, #000 0%, #3a7a00 20%, #7DC900 50%, #3a7a00 80%, #000 100%)" }} />
      <div style={{ background:"linear-gradient(180deg,#0d1f05 0%,#0a1a04 100%)", padding:"0 1.5rem", display:"flex", gap:"0", overflowX:"auto" as const, borderBottom:"1px solid #2a5a00" }}>
        <TabBtn id="projetos" label="Projetos"/><TabBtn id="exportar" label="Exportar"/>
      </div>
      {tab==="projetos"&&(
        <div style={{ padding:"1.2rem 1.5rem", maxWidth:"1200px", color:"#1a3d00" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".9rem", flexWrap:"wrap" as const, gap:".5rem" }}>
            <div style={s.secT}>Meus Projetos</div>
            <button style={s.bp} onClick={addProj}>＋ Novo Projeto</button>
          </div>
          {projetos.length===0
            ?<Alert type="in">Nenhum projeto. Clique em <strong>+ Novo Projeto</strong> para começar.</Alert>
            :projetos.map(p=><ProjetoCard key={p.id} projeto={p} onUpdate={u=>updProj(p.id,u)} onDelete={()=>delProj(p.id)}/>)
          }
        </div>
      )}
      {tab==="exportar"&&<ExportarTab projetos={projetos}/>}
    </div>
  );
}
