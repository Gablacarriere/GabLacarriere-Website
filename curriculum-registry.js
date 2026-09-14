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

  window.GAB_CURRICULUM={
    version:'2.1',
    lastReviewed:'2026-09-14',
    source:'Granola-informed curriculum + dependency logic',
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
    promotionPolicy:{
      rawTeachingNotesStayPrivate:true,
      preserveStableIds:true,
      oneOffObservation:'candidate_only',
      reusableRelationship:'promote_after_repeated_evidence',
      newConcept:'promote_after_repeated_cross_class_evidence',
      drill:'route_to_practice_library_not_curriculum_by_default'
    }
  };
})();
