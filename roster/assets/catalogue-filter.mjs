export function filterCatalogue(rows, {query='', area='', category='', rating='', active=[], savedSlugs=[]}={}) {
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const saved=new Set(savedSlugs);
  const facets={
    price:c=>Boolean(c.published),
    reviews:c=>Boolean(c.hasReviews),
    whatsapp:c=>Boolean(c.whatsapp),
    saved:c=>saved.has(c.slug)
  };
  const matches=rows.filter(c=>
    words.every(word=>[c.name,c.trade,c.area,c.description,...(c.services||[]),...(c.offerings||[])].join(' ').toLowerCase().includes(word))&&
    (!area||c.area===area)&&
    (!category||c.category===category)&&
    (!rating||(c.ratingValue!=null&&c.ratingValue>=Number(rating)))&&
    active.every(key=>!facets[key]||facets[key](c))
  );
  // Count the complete filtered set before sorting, shortlisting or pagination.
  const counts=Object.fromEntries(Object.entries(facets).map(([key,predicate])=>[key,matches.filter(predicate).length]));
  return {matches,counts};
}
