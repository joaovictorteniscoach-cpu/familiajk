/* Junção de três versões: apenas mudanças independentes são automáticas.
   Sem referência anterior, valores diferentes do mesmo registro pedem conferência. */
(function(root){
  const equal=(a,b)=>canonical(a)===canonical(b);
  function key(row,path){
    if(!row||typeof row!=='object')return canonical(row);
    if(row.id||row._jkId||row._k)return String(row.id||row._jkId||row._k);
    const fields=path==='invest.aportes'?['data','mes','conta','pessoa','ativo']:
      path==='invest.global'?['tk']:path.endsWith('.mensal')||path.endsWith('.hist')?['mes']:
      path.endsWith('.anual')?['ano']:['nome','desc','data','date','mes'];
    return fields.map(k=>String(row[k]??'')).join('|');
  }
  function indexed(rows,path){
    const counts=new Map();return new Map(rows.map(row=>{
      const k=key(row,path),n=counts.get(k)||0;counts.set(k,n+1);return [k+'#'+n,row];
    }));
  }
  function merge(base,local,remote,path=''){
    if(equal(local,remote))return structuredClone(local);
    if(equal(local,base))return structuredClone(remote);
    if(equal(remote,base))return structuredClone(local);
    if(Array.isArray(local)&&Array.isArray(remote)&&(base===undefined||Array.isArray(base))){
      const b=indexed(base||[],path),l=indexed(local,path),r=indexed(remote,path),out=[];
      for(const k of new Set([...b.keys(),...r.keys(),...l.keys()])){
        const v=merge(b.get(k),l.get(k),r.get(k),path+'[]');if(v!==undefined)out.push(v);
      }
      return out;
    }
    const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
    if(object(local)&&object(remote)&&(base===undefined||object(base))){
      const out={};for(const k of new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])){
        const v=merge(base&&base[k],local[k],remote[k],path?path+'.'+k:k);if(v!==undefined)out[k]=v;
      }return out;
    }
    throw new Error('Alterações diferentes no mesmo campo: '+path);
  }
  root.mergeFamilyData=function(base,local,remote){
    // A evolução contém somas derivadas, recalculadas após juntar os aportes.
    const months=new Set(),years=new Set();
    for(const d of [base,local,remote])for(const a of d?.invest?.aportes||[]){
      if(a.mes){months.add(a.mes);const y=String(a.mes).split('/')[1];if(y)years.add('20'+y);}
    }
    const prepare=d=>{
      if(d===undefined)return d;const out=structuredClone(d);
      for(const row of out.invest?.mensal||[])if(months.has(row.mes))delete row.aporte;
      for(const row of out.invest?.anual||[])if(years.has(String(row.ano)))delete row.aporte;
      return out;
    };
    return merge(prepare(base),prepare(local),prepare(remote));
  };
})(typeof window==='undefined'?globalThis:window);
