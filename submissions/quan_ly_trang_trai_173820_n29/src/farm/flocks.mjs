export const flockSexLabels={MALE:'Gà trống',FEMALE:'Gà mái'};
export const flockSexOptions=Object.entries(flockSexLabels).map(([value,label])=>({value,label}));
export const flockSex=(flock,index=0)=>flockSexLabels[flock?.sex]?flock.sex:(index%2?'FEMALE':'MALE');
export const flockSexLabel=(flock,index=0)=>flockSexLabels[flockSex(flock,index)];

// Older farm documents did not store sex. Assign it deterministically so the
// same existing flock keeps the same classification without changing other data.
export function normalizeFlockSexes(data){
 if(!data?.flocks)return data;
 data.flocks.forEach((flock,index)=>{if(!flockSexLabels[flock.sex])flock.sex=index%2?'FEMALE':'MALE'});
 return data;
}
