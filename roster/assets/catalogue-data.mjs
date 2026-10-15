// Store repeated field names and service-area names once; decoding restores full records.
export function encodeCatalogue(companies) {
  const fields=[...new Set(companies.flatMap(row=>Object.keys(row)))];
  const indexes=new Map(fields.map((field,index)=>[field,String(index)]));
  const areaNames=[...new Set(companies.flatMap(row=>row.serviceAreas||[]))].sort();
  const areaIndex=new Map(areaNames.map((name,index)=>[name,index]));
  return {format:areaNames.length?'roster-columns-v2':'roster-columns-v1',fields,...(areaNames.length?{areaNames}:{}),companies:companies.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[indexes.get(key),key==='serviceAreas'&&areaNames.length?value.map(name=>areaIndex.get(name)):value])))};
}
export function decodeCatalogue(data) {
  if(!Array.isArray(data?.companies))throw new Error('Invalid company index');
  if(!data.format)return data.companies;
  if(!['roster-columns-v1','roster-columns-v2'].includes(data.format)||!Array.isArray(data.fields)||!data.fields.every(field=>typeof field==='string'))throw new Error('Unsupported company index');
  if(data.format==='roster-columns-v2'&&(!Array.isArray(data.areaNames)||!data.areaNames.every(name=>typeof name==='string')))throw new Error('Invalid service-area dictionary');
  return data.companies.map(row=>Object.fromEntries(Object.entries(row).map(([index,value])=>{
    if(!/^(0|[1-9]\d*)$/.test(index)||Number(index)>=data.fields.length)throw new Error('Invalid company field');
    const key=data.fields[Number(index)];
    if(key==='serviceAreas'&&data.format==='roster-columns-v2'){
      if(!Array.isArray(value)||!value.every(n=>Number.isInteger(n)&&n>=0&&n<data.areaNames.length))throw new Error('Invalid service-area reference');
      value=value.map(n=>data.areaNames[n]);
    }
    return [key,value];
  })));
}
