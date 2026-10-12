// Store repeated field names once; decoding restores the complete card records.
export function encodeCatalogue(companies) {
  const fields=[...new Set(companies.flatMap(row=>Object.keys(row)))];
  const indexes=new Map(fields.map((field,index)=>[field,String(index)]));
  return {format:'roster-columns-v1',fields,companies:companies.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[indexes.get(key),value])))};
}

export function decodeCatalogue(data) {
  if(!Array.isArray(data?.companies))throw new Error('Invalid company index');
  if(!data.format)return data.companies;
  if(data.format!=='roster-columns-v1'||!Array.isArray(data.fields)||!data.fields.every(field=>typeof field==='string'))throw new Error('Unsupported company index');
  return data.companies.map(row=>Object.fromEntries(Object.entries(row).map(([index,value])=>{
    if(!/^(0|[1-9]\d*)$/.test(index)||Number(index)>=data.fields.length)throw new Error('Invalid company field');
    return [data.fields[Number(index)],value];
  })));
}
