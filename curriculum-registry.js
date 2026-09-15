(() => {
  'use strict';
  const source=window.ATLAS_CURRICULUM_V2;
  if(!source)return;

  const concepts=source.rawNodes.map(node=>{
    const meta=source.meta[node.id],family=source.familyFor(node.id);
    return {
      id:node.id,
      name:source.displayName(node.id),
      sourceName:node.sourceName,
      family:meta.family,
      familyName:family?.name||meta.family,
      tier:meta.tier,
      kind:meta.kind||'concept',
      track:meta.track||'shared',
      aliases:[...(meta.aliases||[])],
      relatedTerms:[...(meta.relatedTerms||[])],
      supports:[...(meta.supports||[])],
      status:'active'
    };
  });
  const byId=Object.fromEntries(concepts.map(c=>[c.id,c]));
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const search=query=>{
    const q=normalize(query).trim();if(!q)return [];
    return concepts.filter(c=>normalize([c.name,c.sourceName,c.familyName,...c.aliases,...c.relatedTerms].join(' ')).includes(q));
  };
  const trackFits=(concept,track)=>!track||concept.track==='shared'||concept.track===track;
  const validIds=ids=>[...new Set((ids||[]).filter(id=>byId[id]))];
  const prerequisites=(ids,{recursive=false,track=null}={})=>{
    const chosen=new Set(validIds(ids)),found=new Set(),walk=id=>{
      const concept=byId[id];if(!concept)return;
      for(const support of concept.supports){
        const dependency=byId[support];
        if(!dependency||chosen.has(support)||!trackFits(dependency,track))continue;
        if(!found.has(support)){found.add(support);if(recursive)walk(support);}
      }
    };
    chosen.forEach(walk);
    return [...found].map(id=>byId[id]).sort((a,b)=>a.tier-b.tier||a.familyName.localeCompare(b.familyName)||a.name.localeCompare(b.name));
  };
  const next=(ids,{track=null,limit=12}={})=>{
    const chosen=new Set(validIds(ids));
    return concepts.filter(c=>!chosen.has(c.id)&&trackFits(c,track)&&c.supports.some(id=>chosen.has(id)))
      .sort((a,b)=>a.tier-b.tier||a.familyName.localeCompare(b.familyName)||a.name.localeCompare(b.name)).slice(0,limit);
  };
  const sequence=ids=>{
    const chosen=new Set(validIds(ids)),visiting=new Set(),done=new Set(),ordered=[];
    const visit=id=>{
      if(done.has(id)||visiting.has(id)||!chosen.has(id))return;
      visiting.add(id);for(const dependency of byId[id].supports)visit(dependency);visiting.delete(id);done.add(id);ordered.push(byId[id]);
    };
    [...chosen].sort((a,b)=>byId[a].tier-byId[b].tier||byId[a].name.localeCompare(byId[b].name)).forEach(visit);
    return ordered;
  };

  window.GAB_CURRICULUM={
    version:'2.3',
    lastReviewed:'2026-09-15',
    source:'Granola-informed curriculum + explicit Perception & Projection methodology',
    families:source.families,
    concepts,
    byId,
    concept:id=>byId[id]||null,
    displayName:id=>byId[id]?.name||id,
    familyFor:id=>source.familyFor(id),
    forFamily:familyId=>concepts.filter(c=>c.family===familyId).sort((a,b)=>a.tier-b.tier||a.name.localeCompare(b.name)),
    relations:source.relations,
    related:id=>source.related(id),
    search,
    trackFits,
    validIds,
    prerequisites,
    next,
    sequence,
    promotionPolicy:{
      rawTeachingNotesStayPrivate:true,
      preserveStableIds:true,
      oneOffObservation:'candidate_only',
      reusableRelationship:'promote_after_repeated_evidence',
      newConcept:'promote_after_repeated_cross_class_evidence_or_explicit_gab_decision',
      drill:'route_to_practice_library_not_curriculum_by_default'
    }
  };
})();
