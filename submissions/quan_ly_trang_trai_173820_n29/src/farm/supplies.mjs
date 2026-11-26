import {FarmError,today} from './model.mjs';
export const supplyLabels={FEED:'Thức ăn',MEDICINE:'Thuốc',VACCINE:'Vắc xin',SUPPLIES:'Vật tư tiêu hao',EQUIPMENT:'Dụng cụ & Thiết bị'};
export const packKg=i=>Number(i?.bagKg)||25;
export const stockUnit=i=>i?.type==='FEED'?'bao':i?.unit||'';
export const stockCount=i=>i?.type==='FEED'?i.quantity/packKg(i):i?.quantity||0;
export const stockMin=i=>i.type==='FEED'?i.minQuantity/packKg(i):i.minQuantity;
const fail=m=>{throw new FarmError(m)};
const number=(x,label,min=0,max=1e9)=>{const n=Number(x);if(x==null||x===''||typeof x==='boolean'||!Number.isFinite(n)||n<min||n>max)fail(label+' phải từ '+min+' đến '+max+'.');return n};
const item=(d,id)=>{const i=d.inventory.find(i=>i.id===id);if(!i)fail('Không tìm thấy vật tư trong kho.');return i};
export function feedFields(d,p){
 const i=item(d,p.itemId);if(i.type!=='FEED'||i.unit!=='kg')fail('Hãy chọn cám trong nhóm Thức ăn.');
 const bagKg=packKg(i),bags=(p.inputUnit==='BAG'||(p.bags!==undefined&&p.amount===undefined))?number(p.bags,'Số bao cám',1):number(p.amount,'Lượng cám',.001,1e7)/bagKg;
 if(!Number.isInteger(bags))fail('Số bao cám phải là số nguyên.');
 const amount=Math.round(bags*bagKg*1000)/1000;number(amount,'Lượng cám',.001,1e7);
 const mode=p.waterMode||(Number(p.water)>0?'LEGACY':'CLEAN');if(!['CLEAN','MEDICATED','LEGACY'].includes(mode))fail('Chế độ nước uống không hợp lệ.');
 const result={amount,bags,bagKg,waterMode:mode,water:mode==='CLEAN'?0:number(p.water||0,'Số lít nước',mode==='MEDICATED'?.001:0),waterCourse:'',waterStart:'',waterEnd:'',medicineId:'',medicineAmount:0,medicineUnit:''};
 if(mode==='MEDICATED'){
  if(!Number.isInteger(result.water))fail('Nước pha thuốc phải ghi theo số lít nguyên.');
  result.waterStart=p.date;result.waterEnd=p.date;
  const medicine=item(d,p.medicineId);if(!['MEDICINE','VACCINE'].includes(medicine.type))fail('Chọn thuốc hoặc vắc xin dùng pha nước.');
  Object.assign(result,{medicineId:medicine.id,medicineAmount:number(p.medicineAmount,'Lượng thuốc / vắc xin thực dùng',.001),medicineUnit:medicine.unit});
 }
 return result;
}
export function healthSupply(d,p){
 if(!p.supplyId)return{supplyId:'',supplyAmount:0,supplyUnit:''};
 const i=item(d,p.supplyId);if(!['MEDICINE','VACCINE'].includes(i.type))fail('Chọn vật tư thuộc nhóm Thuốc hoặc Vắc xin.');
 return{supplyId:i.id,supplyAmount:number(p.supplyAmount,'Lượng thuốc / vắc xin đã dùng',.001),supplyUnit:i.unit};
}
export function moveStock(d,id,delta,{date=today(),reason='',sourceId='',by='Hệ thống'}={}){
 const i=item(d,id),next=Math.round((i.quantity+delta)*1000)/1000;if(next<0)fail(`Không đủ tồn kho: ${i.name} còn ${i.type==='FEED'?stockCount(i):i.quantity} ${stockUnit(i)}.`);
 if(next>1e9)fail('Tồn kho vượt giới hạn.');i.quantity=next;d.stockMoves??=[];
 d.stockMoves.unshift({id:crypto.randomUUID(),itemId:id,date,delta:Math.round(delta*1000)/1000,balance:next,unit:i.unit,bagKg:i.type==='FEED'?packKg(i):null,reason,sourceId,by});
}
export function useFeedStock(d,r,sign=-1,by=r.createdBy){if(sign<0){r.feedUnitPrice??=item(d,r.itemId).unitPrice||0;if(r.medicineId)r.medicineUnitPrice??=item(d,r.medicineId).unitPrice||0;}const context={date:r.date,reason:sign<0?'Cho ăn':'Hoàn lại nhật ký cho ăn',sourceId:r.id,by};moveStock(d,r.itemId,sign*r.amount,context);if(r.medicineId&&r.medicineAmount>0)moveStock(d,r.medicineId,sign*r.medicineAmount,{...context,reason:sign<0?'Pha nước uống trong ngày':'Hoàn lại thuốc pha nước'})}
export function useHealthStock(d,r,sign=-1,by=r.createdBy){if(r.supplyId&&r.supplyAmount>0){if(sign<0)r.supplyUnitPrice??=item(d,r.supplyId).unitPrice||0;moveStock(d,r.supplyId,sign*r.supplyAmount,{date:r.date,reason:sign<0?'Thuốc / Vắc xin chăm sóc đàn':'Hoàn lại vật tư sức khỏe',sourceId:r.id,by})}}
