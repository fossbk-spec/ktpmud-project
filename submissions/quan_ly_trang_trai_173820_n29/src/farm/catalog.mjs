export const SAMPLE_BREEDS = [
 {id:'sample-breed-ri',name:'Gà Ri',maleFeedPer1000:9500,femaleFeedPer1000:8500,feedPer1000:9000,harvestDays:100,density:8,sampleBreed:true},
 {id:'sample-breed-mia',name:'Gà Mía',maleFeedPer1000:14000,femaleFeedPer1000:12400,feedPer1000:13200,harvestDays:120,density:7,sampleBreed:true},
 {id:'sample-breed-luong-phuong',name:'Gà Lương Phượng',maleFeedPer1000:9500,femaleFeedPer1000:8500,feedPer1000:9000,harvestDays:90,density:8,sampleBreed:true},
];
// Legacy values were grams/bird/day. Convert to kg/1,000 birds for a full cycle.
export const feedPer1000 = (breed,sex='') => {
 const legacy=Number(breed?.feedPer1000??((breed?.feedPerDay||0)*(breed?.harvestDays||0)));
 if(sex==='MALE')return Number(breed?.maleFeedPer1000??legacy);
 if(sex==='FEMALE')return Number(breed?.femaleFeedPer1000??legacy);
 const male=Number(breed?.maleFeedPer1000),female=Number(breed?.femaleFeedPer1000);
 return Number.isFinite(male)&&Number.isFinite(female)?(male+female)/2:legacy;
};
export const isSampleBreed = breed => breed.sampleBreed===true||(['b1','b2','b3'].includes(breed.id)&&breed.feedPer1000===undefined&&SAMPLE_BREEDS.some(b=>b.name===breed.name&&b.feedPer1000===feedPer1000(breed)&&b.harvestDays===breed.harvestDays&&b.density===breed.density));
export const sampleBreedsEnabled = d => d.settings.sampleBreeds??d.breeds.some(isSampleBreed);
