// Cash receipts and the cost of supplies consumed by a flock are separate views.
// A warehouse purchase is cash out once; it is never added again to farm cash out.
export const flockPurchaseId=flockId=>`flock-purchase-${flockId}`;
export function workerDailyWage(worker,dateOrMonth=''){
 const month=String(dateOrMonth||'').slice(0,7),monthly=worker?.monthlyWages;
 if(month&&monthly&&Object.prototype.hasOwnProperty.call(monthly,month))return Number(monthly[month])||0;
 return Number(worker?.dailyWage)||0;
}
export function flockPurchaseRecords(d){
 return d.flocks.flatMap(f=>{
  const manual=d.finance.some(r=>r.flockId===f.id&&r.type==='EXPENSE'&&(r.category==='Con giống'||r.id===flockPurchaseId(f.id)));
  const amount=Math.round(Number(f.initialQuantity||0)*Number(f.purchasePrice||0));
  if(manual||amount<=0)return[];
  return[{id:flockPurchaseId(f.id),date:f.importDate,type:'EXPENSE',category:'Con giống',amount,quantity:Number(f.initialQuantity||0),unit:'con',flockId:f.id,
   note:`Tự động tính: ${f.initialQuantity} con × ${f.purchasePrice} ₫/con`,source:'FLOCK_PURCHASE_AUTO'}];
 });
}
const workFactor=shift=>shift==='FULL'?1:shift==='HALF'?.5:0;
function assignedFlocksAt(worker,date){
 const history=[...(worker.assignmentHistory||[])].filter(r=>r?.date&&Array.isArray(r.flockIds)).sort((a,b)=>b.date.localeCompare(a.date));
 const entry=history.find(r=>r.date<=date);
 // Include the current list as a compatibility source. Lifecycle filtering
 // below prevents a flock imported later from receiving older attendance.
 return [...new Set([...(entry?.flockIds||[]),...(Array.isArray(worker.flockIds)?worker.flockIds:[])])];
}
function weightedAmounts(total,weights){const sum=weights.reduce((s,n)=>s+n,0);let used=0;return weights.map((weight,index)=>{const amount=index===weights.length-1?total-used:Math.round(total*weight/sum);used+=amount;return amount})}
export function laborCostRecords(d){
 const rows=[];
 for(const attendance of d.attendance.filter(r=>r.status==='APPROVED')){
  const worker=d.workers.find(w=>w.id===attendance.workerId),factor=workFactor(attendance.shift),dailyWage=Number(attendance.dailyWage??workerDailyWage(worker,attendance.date));
  if(!worker||factor<=0||dailyWage<=0)continue;
  const total=Math.round(dailyWage*factor),assigned=assignedFlocksAt(worker,attendance.date).map(id=>d.flocks.find(f=>f.id===id)).filter(f=>f&&attendance.date>=f.importDate&&(!f.exportDate||attendance.date<=f.exportDate));
  if(!assigned.length)continue;const birdCounts=assigned.map(f=>Math.max(0,Number(f.exportQuantity??f.quantity??f.initialQuantity??0))),totalBirds=birdCounts.reduce((s,n)=>s+n,0);if(totalBirds<=0)continue;const amounts=weightedAmounts(total,birdCounts);
  assigned.forEach((flock,index)=>rows.push({
   id:`labor-${attendance.id}-${flock.id}`,attendanceId:attendance.id,date:attendance.date,flockId:flock.id,type:'EXPENSE',category:'Lương nhân viên',
   itemId:`worker-${worker.id}`,itemName:worker.name,quantity:factor*birdCounts[index]/totalBirds,unit:'công',amount:amounts[index],source:'LABOR_AUTO',
   note:`Tự tính từ chấm công: ${factor} công × ${dailyWage} ₫/ngày; phân bổ theo ${birdCounts[index]}/${totalBirds} con của các đàn được giao`
  }));
 }
 return rows;
}

export function monthlyLaborRecords(d,filters={}){
 const groups=new Map(),attendanceById=new Map(d.attendance.map(r=>[r.id,r]));
 for(const row of laborCostRecords(d).filter(r=>inPeriod(r,filters))){
  const month=row.date.slice(0,7),group=groups.get(month)||{id:`labor-month-${month}`,date:`${month}-01`,month,type:'EXPENSE',category:'Lương nhân viên',itemName:`Tháng ${month.slice(5)}/${month.slice(0,4)}`,quantity:0,unit:'công',amount:0,source:'LABOR_MONTHLY',workerMap:new Map()};
  const attendance=attendanceById.get(row.attendanceId),worker=d.workers.find(w=>w.id===attendance?.workerId),workerId=worker?.id||row.itemId||row.itemName,dailyWage=Number(attendance?.dailyWage??workerDailyWage(worker,row.date));
  const line=group.workerMap.get(workerId)||{id:workerId,name:worker?.name||row.itemName||'Nhân viên',dailyWage,days:0,amount:0,flockIds:new Set()};
  line.days+=Number(row.quantity||0);line.amount+=Number(row.amount||0);if(row.flockId)line.flockIds.add(row.flockId);group.workerMap.set(workerId,line);
  group.quantity+=Number(row.quantity||0);group.amount+=Number(row.amount||0);groups.set(month,group);
 }
 return [...groups.values()].sort((a,b)=>b.month.localeCompare(a.month)).map(group=>{
  const workerLines=[...group.workerMap.values()].sort((a,b)=>a.name.localeCompare(b.name,'vi')).map(line=>({...line,flockIds:[...line.flockIds]}));
  return{...group,workerMap:undefined,workerLines,note:workerLines.map(line=>`${line.name}: ${line.dailyWage} ₫/ngày · ${line.days.toLocaleString('vi-VN',{maximumFractionDigits:3})} công`).join(' | ')};
 });
}
function enrichCash(d,row){
 const r={...row};
 if(r.labor){r.quantity=Number(r.labor.hours||0);r.unit='giờ'}
 if(r.category==='Con giống'&&r.flockId){const flock=d.flocks.find(f=>f.id===r.flockId);if(flock){r.quantity=Number(flock.initialQuantity||0);r.unit='con'}}
 return r;
}
export const cashRecords = d => [...d.finance.filter(r => r.source !== 'EXPORT'),...flockPurchaseRecords(d),...laborCostRecords(d)].map(r=>enrichCash(d,r));
export function selectedMonths({month='',months=[]}={}) {
 return [...new Set(months.length?months:month?[month]:[])].filter(m=>/^\d{4}-(0[1-9]|1[0-2])$/.test(m)).sort();
}
export function inPeriod(row, filters={}) {
 const months=selectedMonths(filters);
 return !months.length||months.includes(row.date?.slice(0,7));
}
export function usageCosts(d) {
 const rows=[];
 const add=(r,itemId,costQuantity,price,category,displayQuantity=costQuantity,unitOverride='')=>{
  if(!itemId||!costQuantity)return;
  const item=d.inventory.find(i=>i.id===itemId),unitPrice=Number(price??item?.unitPrice??0);
  rows.push({id:`usage-${r.id}-${itemId}`,date:r.date,flockId:r.flockId,type:'EXPENSE',category,
   itemId,itemName:item?.name||'Vật tư',quantity:displayQuantity,unit:unitOverride||item?.unit||'',amount:Math.round(costQuantity*unitPrice),
   source:'USAGE',estimated:price==null,note:price==null?'Nhật ký cũ: tính theo đơn giá kho hiện tại':'Vật tư đã dùng theo nhật ký đã duyệt'});
 };
 for(const r of d.feeding.filter(r=>r.status==='APPROVED')){
  add(r,r.itemId,r.amount,r.feedUnitPrice,'Thức ăn',r.bagKg?r.amount/r.bagKg:r.amount,r.bagKg?'bao':'kg');
  add(r,r.medicineId,r.medicineAmount,r.medicineUnitPrice,d.inventory.find(i=>i.id===r.medicineId)?.type==='VACCINE'?'Vắc xin':'Thuốc');
 }
 for(const r of d.health.filter(r=>r.status==='APPROVED'))
  add(r,r.supplyId,r.supplyAmount,r.supplyUnitPrice,d.inventory.find(i=>i.id===r.supplyId)?.type==='VACCINE'?'Vắc xin':'Thuốc');
 return rows;
}
export function flockRecords(d,flockId,filters={}) {
 return [...cashRecords(d),...usageCosts(d)].filter(r=>r.flockId===flockId&&inPeriod(r,filters));
}
export function totals(rows) {
 const income=rows.filter(r=>r.type==='INCOME').reduce((s,r)=>s+r.amount,0);
 const expense=rows.filter(r=>r.type==='EXPENSE').reduce((s,r)=>s+r.amount,0);
 return {income,expense,balance:income-expense};
}
export function aggregateFinance(rows) {
 const groups=new Map();
 for(const r of rows){
  const source=r.source||'CASH',key=JSON.stringify([r.type,r.category,r.itemId||'',source]);
  const g=groups.get(key)||{id:key,type:r.type,category:r.category,itemName:r.itemName||'',unit:r.unit||'',source,amount:0,quantity:0,records:[],estimated:false};
  g.amount+=r.amount;g.quantity+=r.quantity||0;g.estimated||=!!r.estimated;g.records.push(r);groups.set(key,g);
 }
 return [...groups.values()].sort((a,b)=>a.type.localeCompare(b.type)||a.category.localeCompare(b.category)||a.itemName.localeCompare(b.itemName));
}
