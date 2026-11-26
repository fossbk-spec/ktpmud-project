import test from 'node:test';
import assert from 'node:assert/strict';
import {createFarm,mutateFarm,today,addDays,visibleData,validateBackup} from './model.mjs';
import {cashRecords,flockRecords,usageCosts,laborCostRecords,monthlyLaborRecords,aggregateFinance,totals} from './finance.mjs';
import {reportSheets,workbook} from './export.mjs';
import {registerFarm} from '../server/farm-auth.mjs';

const owner={role:'FARM_OWNER',name:'Chủ trại'};
const apply=(d,type,payload,actor=owner)=>mutateFarm(d,{type,payload},actor).data;
function fixture(){
 let d=createFarm({farmName:'Trại kiểm thử'});
 d=apply(d,'barn.save',{code:'A1',name:'Chuồng A1',capacity:5000,area:1000,zone:'A',status:'READY'});
 d.barns[0].id='barn';
 d=apply(d,'flock.save',{code:'GA1',name:'Đàn 1',breed:'Gà Ri',barnId:'barn',quantity:1000,importDate:'2023-01-01',expectedDate:addDays(today(),30),avgWeight:1,purchasePrice:15000});
 d.flocks[0].id='flock';
 d=apply(d,'inventory.save',{name:'Cám 25kg',type:'FEED',bagKg:25,stockBags:100,minBags:5,pricePerBag:250000});
 d.inventory[0].id='feed';
 d=apply(d,'inventory.save',{name:'Thuốc A',type:'MEDICINE',quantity:10,minQuantity:1,unit:'lọ',unitPrice:50000});
 d.inventory[0].id='medicine';
 d=apply(d,'worker.save',{name:'Công nhân',username:'worker',active:true,flockIds:['flock']});
 d.workers[0].id='worker';
 return d;
}
const feeding=(extra={})=>({flockId:'flock',itemId:'feed',inputUnit:'BAG',bags:2,date:today(),waterMode:'CLEAN',weight:1,...extra});
const health=(extra={})=>({flockId:'flock',date:today(),sick:5,dead:2,condition:'Cần theo dõi',...extra});
const worker={role:'WORKER',workerId:'worker',name:'Công nhân'};

test('new farms contain no operational demo data; each demo starts fresh',()=>{
 const blank=createFarm({farmName:'Trại riêng'});
 for(const key of ['barns','flocks','feeding','inventory','finance','workers','breeds'])assert.equal(blank[key].length,0,key);
 assert.equal(blank.settings.address,'');
 const first=createFarm({sample:true}),second=createFarm({sample:true});
 first.flocks[0].name='Đã sửa';
 assert.notEqual(second.flocks[0].name,first.flocks[0].name);
 assert.ok(second.feeding.every(r=>Number.isInteger(r.bags)));
 assert.ok(second.inventory.filter(i=>i.type==='FEED').every(i=>Number.isInteger(i.quantity/i.bagKg)));
});

test('registration ignores a submitted request for full sample data',async()=>{
 let saved;
 const db={prepare(sql){return{bind(...values){return{async first(){return sql.includes('auth_attempts')?{failures:1}:null},async run(){},sql,values}}}},async batch(statements){saved=JSON.parse(statements.find(s=>s.sql.includes('farm_documents')).values[1])}};
 await registerFarm(db,{farmCode:'TRAI_MOI',farmName:'Trại mới',fullName:'Chủ trại',username:'owner',password:'test-password-123',sample:true},'test');
 assert.equal(saved.sample,false);assert.equal(saved.flocks.length,0);assert.equal(saved.feeding.length,0);
});

test('only integer bags and integer litres are accepted, including kilogram bypass',()=>{
 const d=fixture(),original=structuredClone(d);
 assert.throws(()=>apply(d,'feeding.create',feeding({bags:1.5})),/số nguyên/);
 assert.throws(()=>apply(d,'feeding.create',feeding({bags:1.00000001})),/số nguyên/);
 assert.throws(()=>apply(d,'feeding.create',feeding({inputUnit:'KG',bags:undefined,amount:37.5})),/số nguyên/);
 const medication={waterMode:'MEDICATED',water:250,medicineId:'medicine',medicineAmount:.5};
 assert.throws(()=>apply(d,'feeding.create',feeding({...medication,water:250.5})),/số lít nguyên/);
 const next=apply(d,'feeding.create',feeding(medication)),r=next.feeding[0];
 assert.equal(r.waterStart,today());assert.equal(r.waterEnd,today());assert.equal(r.waterCourse,'');
 assert.equal(next.inventory.find(i=>i.id==='feed').quantity,2450);
 assert.equal(next.inventory.find(i=>i.id==='medicine').quantity,9.5);
 assert.deepEqual(d,original,'failed or successful mutations do not modify their input');
});

test('a feeding date range creates daily logs and multiplies stock and finance totals',()=>{
 const from=addDays(today(),-2),d=apply(fixture(),'feeding.create',feeding({date:from,dateEnd:today(),bags:2}));
 const rows=d.feeding.filter(r=>r.flockId==='flock');
 assert.equal(rows.length,3);assert.deepEqual(rows.map(r=>r.date).sort(),[from,addDays(from,1),today()]);
 assert.ok(rows.every(r=>r.bags===2&&r.amount===50));
 assert.equal(d.inventory.find(i=>i.id==='feed').quantity,2350);
 assert.equal(totals(usageCosts(d)).expense,1500000);
 const usage=aggregateFinance(flockRecords(d,'flock')).find(r=>r.source==='USAGE');
 assert.equal(usage.quantity,6);assert.equal(usage.unit,'bao');
});

test('approved usage prices remain stable after inventory price changes and log corrections',()=>{
 let d=apply(fixture(),'feeding.create',feeding({waterMode:'MEDICATED',water:250,medicineId:'medicine',medicineAmount:.5}));
 const id=d.feeding[0].id;
 d=apply(d,'inventory.save',{...d.inventory.find(i=>i.id==='feed'),pricePerBag:500000,minBags:5});
 assert.equal(totals(usageCosts(d)).expense,525000);
 d=apply(d,'feeding.update',{...d.feeding[0],inputUnit:'BAG',bags:3});
 assert.equal(d.feeding[0].feedUnitPrice,10000);
 assert.equal(totals(usageCosts(d)).expense,775000);
 d=apply(d,'feeding.delete',{id});
 assert.equal(totals(usageCosts(d)).expense,0);
 assert.equal(d.inventory.find(i=>i.id==='feed').quantity,2500);
 assert.equal(d.inventory.find(i=>i.id==='medicine').quantity,10);
});

test('pending worker use is priced and subtracted only on approval',()=>{
 let d=apply(fixture(),'feeding.create',feeding(),worker);
 assert.equal(usageCosts(d).length,0);
 assert.equal(d.inventory.find(i=>i.id==='feed').quantity,2500);
 d=apply(d,'inventory.save',{...d.inventory.find(i=>i.id==='feed'),pricePerBag:300000,minBags:5});
 d=apply(d,'approval.resolve',{id:d.feeding[0].id,kind:'feeding',decision:'APPROVED'});
 assert.equal(totals(usageCosts(d)).expense,600000);
 const visible=visibleData(d,worker);
 assert.equal(visible.feeding[0].feedUnitPrice,undefined);
 assert.equal(visible.inventory[0].unitPrice,undefined);
 assert.throws(()=>apply(d,'approval.resolve',{id:d.feeding[0].id,kind:'feeding',decision:'APPROVED'}),/đã được xử lý/);
});

test('owner can treat a pending health report without approving mortality twice',()=>{
 let d=apply(fixture(),'health.create',health(),worker),id=d.health[0].id;
 assert.throws(()=>apply(d,'health.treat',{id,treatment:'Đã xử lý'},worker),/Chỉ chủ/);
 d=apply(d,'health.treat',{id,treatment:'Đã xử lý theo hướng dẫn',supplyId:'medicine',supplyAmount:.5});
 assert.equal(d.health[0].status,'PENDING');assert.equal(d.flocks[0].quantity,1000);
 assert.equal(d.inventory.find(i=>i.id==='medicine').quantity,10);
 d=apply(d,'approval.resolve',{kind:'health',id,decision:'APPROVED'});
 assert.equal(d.flocks[0].quantity,998);
 assert.equal(d.inventory.find(i=>i.id==='medicine').quantity,9.5);
 assert.equal(totals(usageCosts(d)).expense,25000);
});

test('flock purchase cost is automatic and editable while sale revenue stays manual',()=>{
 let d=apply(fixture(),'feeding.create',feeding());
 d=apply(d,'flock.export',{id:'flock',totalWeight:1000,price:65000,date:today()});
 assert.equal(d.flocks[0].status,'EXPORTED');assert.equal(d.finance.length,0);
 assert.equal(totals(flockRecords(d,'flock')).expense,15500000);
 const auto=cashRecords(d).find(r=>r.source==='FLOCK_PURCHASE_AUTO');
 assert.equal(auto.amount,15000000);assert.equal(auto.category,'Con giống');
 d=apply(d,'finance.save',{...auto,amount:14000000});
 assert.equal(totals(flockRecords(d,'flock')).expense,14500000);
 d=apply(d,'finance.delete',{id:auto.id});
 assert.equal(totals(flockRecords(d,'flock')).expense,15500000);
 d=apply(d,'finance.save',{type:'INCOME',category:'Bán gà',amount:60000000,flockId:'flock',date:today()});
 assert.equal(totals(flockRecords(d,'flock')).income,60000000);
 d.finance.push({id:'old-export',type:'INCOME',amount:65000000,source:'EXPORT',flockId:'flock',date:today(),category:'Bán gà'});
 assert.equal(totals(cashRecords(d)).income,60000000,'legacy forecast receipts are excluded');
});

test('warehouse cash is counted once, while flock usage is accumulated once per item',()=>{
 let d=apply(fixture(),'inventory.restock',{id:'feed',bags:10,cost:2500000,date:today()});
 d=apply(d,'feeding.create',feeding({date:addDays(today(),-1)}));
 d=apply(d,'feeding.create',feeding({bags:1}));
 assert.equal(totals(cashRecords(d)).expense,17500000);
 const groups=aggregateFinance(flockRecords(d,'flock'));
 assert.equal(groups.length,2);
 const usage=groups.find(r=>r.source==='USAGE'),purchase=groups.find(r=>r.category==='Con giống');
 assert.equal(usage.quantity,3);assert.equal(usage.unit,'bao');assert.equal(usage.amount,750000);assert.equal(usage.records.length,2);
 assert.equal(purchase.amount,15000000);assert.equal(purchase.quantity,1000);assert.equal(purchase.unit,'con');
 const sheets=reportSheets(d,{flockId:'flock',month:'2000-01'});
 const flockSheet=sheets.find(s=>s.name.startsWith('Đàn 1 '));
 assert.equal(flockSheet.rows.length,2);assert.equal(flockSheet.rows.find(r=>String(r[2]).includes('Thức ăn'))[3],750000);
 assert.equal(sheets.find(s=>s.name==='Tổng hợp').rows.find(r=>r[0]==='Tổng chi (₫)')[1],15750000);
});

test('approved attendance is split across assigned flocks by bird quantity using the saved daily wage',()=>{
 let d=fixture();
 d=apply(d,'barn.save',{code:'B2',name:'Chuồng B2',capacity:5000,area:1000,zone:'B',status:'READY'});d.barns[0].id='barn2';
 d=apply(d,'flock.save',{code:'GA2',name:'Đàn 2',breed:'Gà Ri',barnId:'barn2',quantity:3000,importDate:'2023-01-01',expectedDate:addDays(today(),30),avgWeight:1,purchasePrice:15000});d.flocks[0].id='flock2';
 const employee=d.workers.find(w=>w.id==='worker');
 d=apply(d,'worker.save',{...employee,dailyWage:300000,flockIds:['flock','flock2'],assignedDate:addDays(today(),-2)});
 d=apply(d,'attendance.create',{workerId:'worker',date:addDays(today(),-1),shift:'FULL'});
 const labor=laborCostRecords(d);assert.equal(labor.length,2);assert.equal(totals(labor).expense,300000);
 assert.deepEqual(labor.map(r=>r.amount).sort((a,b)=>a-b),[75000,225000]);
 assert.deepEqual(labor.map(r=>r.quantity).sort((a,b)=>a-b),[.25,.75]);
 assert.ok(labor.every(r=>r.unit==='công'&&r.source==='LABOR_AUTO'));
 assert.equal(d.attendance[0].dailyWage,300000);
 d=apply(d,'worker.save',{...d.workers.find(w=>w.id==='worker'),dailyWage:400000});
 assert.equal(totals(laborCostRecords(d)).expense,300000,'changing the current wage does not rewrite approved attendance');
 d=apply(d,'flock.export',{id:'flock',totalWeight:1000,price:65000,date:today()});
 const exportedLabor=flockRecords(d,'flock').find(r=>r.source==='LABOR_AUTO');
 assert.equal(exportedLabor.amount,75000,'labor remains in the exported flock cost report');
});

test('attendance date ranges use the employee monthly wage and skip dates already recorded',()=>{
 let d=fixture(),from=addDays(today(),-2);
 d=apply(d,'worker.save',{...d.workers.find(w=>w.id==='worker'),assignedDate:addDays(today(),-3)});
 d=apply(d,'worker.wage.save',{id:'worker',month:today().slice(0,7),dailyWage:220000});
 d=apply(d,'attendance.create',{workerId:'worker',date:from,dateEnd:today(),shift:'FULL',dailyWage:999999999});
 assert.equal(d.attendance.length,3);assert.ok(d.attendance.every(r=>r.dailyWage===220000&&r.status==='APPROVED'));
 assert.equal(totals(laborCostRecords(d)).expense,660000);
 d=apply(d,'attendance.create',{workerId:'worker',date:addDays(today(),-3),dateEnd:from,shift:'HALF'});
 assert.equal(d.attendance.length,4,'the overlapping day is not duplicated');
 assert.equal(totals(laborCostRecords(d)).expense,770000);
});

test('all-farm labor is grouped once per month with worker names and daily rates',()=>{
 let d=fixture(),from=addDays(today(),-1),month=today().slice(0,7);
 d=apply(d,'worker.wage.save',{id:'worker',month,dailyWage:200000});
 d=apply(d,'attendance.create',{workerId:'worker',date:from,dateEnd:today(),shift:'FULL'});
 d=apply(d,'flock.export',{id:'flock',totalWeight:1000,price:65000,date:today()});
 const grouped=monthlyLaborRecords(d,{months:[month]});
 assert.equal(grouped.length,1);assert.equal(grouped[0].amount,400000);assert.equal(grouped[0].workerLines.length,1);
 assert.equal(grouped[0].workerLines[0].name,'Công nhân');assert.equal(grouped[0].workerLines[0].dailyWage,200000);assert.equal(grouped[0].workerLines[0].days,2);
 assert.equal(flockRecords(d,'flock').filter(r=>r.source==='LABOR_AUTO').length,2,'exported flock keeps every historical labor allocation');
 const sheets=reportSheets(d,{months:[month]}),cashSheet=sheets.find(s=>s.name==='Thu chi'),laborSheet=sheets.find(s=>s.name==='Lương nhân viên');
 assert.equal(cashSheet.rows.filter(r=>String(r[2]).includes('Lương nhân viên')).length,1,'all-farm cash report has one monthly labor row');
 assert.equal(laborSheet.rows.length,1);assert.deepEqual(laborSheet.rows[0].slice(1,5),['Công nhân',200000,2,400000]);
 assert.ok(sheets.every(s=>s.rows.every(r=>r.length<=s.headers.length)),'every Excel row fits its declared columns');
 const xml=new TextDecoder().decode(workbook(sheets));assert.match(xml,/LƯƠNG NHÂN VIÊN THEO THÁNG/);assert.match(xml,/Công nhân/);
});

test('monthly wage updates existing attendance and workers cannot edit the rate',()=>{
 let d=fixture();
 d=apply(d,'worker.wage.save',{id:'worker',month:today().slice(0,7),dailyWage:250000});
 d=apply(d,'attendance.create',{workerId:'worker',date:today(),shift:'FULL',dailyWage:900000000});
 assert.equal(d.attendance[0].dailyWage,250000,'attendance ignores a submitted wage');
 d=apply(d,'worker.wage.save',{id:'worker',month:today().slice(0,7),dailyWage:300000});
 assert.equal(d.attendance[0].dailyWage,300000,'editing the monthly rate resynchronizes that month');
 assert.equal(totals(laborCostRecords(d)).expense,300000);
 assert.throws(()=>apply(d,'worker.wage.save',{id:'worker',month:today().slice(0,7),dailyWage:1},worker),/Chỉ chủ trang trại/);
});

test('calendar attendance toggles full days without changing half-day meaning',()=>{
 let d=fixture();
 d=apply(d,'worker.save',{...d.workers.find(w=>w.id==='worker'),dailyWage:210000,assignedDate:addDays(today(),-2)});
 d=apply(d,'attendance.toggle',{workerId:'worker',date:today()});
 assert.equal(d.attendance.length,1);assert.equal(d.attendance[0].shift,'FULL');assert.equal(d.attendance[0].status,'APPROVED');assert.equal(d.attendance[0].dailyWage,210000);
 d=apply(d,'attendance.toggle',{workerId:'worker',date:today()});assert.equal(d.attendance.length,0);
 d=apply(d,'attendance.create',{workerId:'worker',date:today(),shift:'HALF',dailyWage:210000});assert.equal(d.attendance[0].shift,'HALF');
 d=apply(d,'attendance.toggle',{workerId:'worker',date:today()});assert.equal(d.attendance.length,0,'clicking a marked half day removes that attendance');
 d=apply(d,'attendance.toggle',{date:today()},worker);assert.equal(d.attendance[0].status,'PENDING');
 d=apply(d,'attendance.toggle',{date:today()},worker);assert.equal(d.attendance.length,0,'a worker can undo their own pending quick attendance');
});

test('the first wage entered snapshots older attendance before later wage changes',()=>{
 let d=fixture();d.attendance.push({id:'legacy-work',workerId:'worker',date:today(),shift:'FULL',status:'APPROVED'});
 d=apply(d,'worker.save',{...d.workers.find(w=>w.id==='worker'),dailyWage:250000});assert.equal(d.attendance[0].dailyWage,250000);
 d=apply(d,'worker.save',{...d.workers.find(w=>w.id==='worker'),dailyWage:350000});
 assert.equal(d.attendance[0].dailyWage,250000);assert.equal(totals(laborCostRecords(d)).expense,250000);
});

test('multi-year reports keep monthly cash totals and separate sheets for every flock',()=>{
 const d=fixture();
 d.finance=[{id:'one',date:'2024-12-10',type:'INCOME',category:'Bán gà',amount:100,flockId:'flock'}, {id:'two',date:'2025-01-10',type:'EXPENSE',category:'Nhân công',amount:20,flockId:'flock'}, {id:'outside',date:'2025-02-10',type:'EXPENSE',category:'Khác',amount:1000,flockId:'flock'}];
 d.flocks.push({...d.flocks[0],id:'second',code:'GA2'});
 const sheets=reportSheets(d,{months:['2024-12','2025-01']});
 assert.deepEqual(sheets.find(s=>s.name==='Theo tháng').rows,[['2024-12',100,0,100],['2025-01',0,20,-20]]);
 const flockSheets=sheets.filter(s=>s.name.startsWith('Đàn '));assert.equal(flockSheets.length,3); // Includes the flock directory.
 assert.ok(sheets.find(s=>s.name.startsWith('Đàn 1 GA1')));
 assert.ok(sheets.find(s=>s.name.startsWith('Đàn 2 GA2')));
 const bytes=workbook(sheets);assert.equal(bytes[0],0x50);assert.equal(bytes[1],0x4b);
 assert.equal(new Set(sheets.map(s=>s.name)).size,sheets.length);
});

test('sample breed catalogue toggles preserve edited or historically used breeds',()=>{
 let d=apply(createFarm(),'breed.samples',{enabled:true});assert.equal(d.breeds.length,3);
 const breed=d.breeds[0];d=apply(d,'breed.save',{...breed,maleFeedPer1000:10500,femaleFeedPer1000:9500});
 d=apply(d,'breed.samples',{enabled:false});assert.equal(d.breeds.length,1);assert.equal(d.breeds[0].maleFeedPer1000,10500);assert.equal(d.breeds[0].femaleFeedPer1000,9500);
 const old=createFarm();old.breeds=[{id:'old',name:'Gà cũ',feedPerDay:90,harvestDays:100,density:8}];
 assert.equal(validateBackup({schemaVersion:1,data:old}),true);
 assert.equal(validateBackup({schemaVersion:1,data:d}),true);
});

test('map pins keep their compact horizontal or vertical orientation',()=>{
 let d=fixture();
 d=apply(d,'map.pin',{id:'barn',x:35,y:45,orientation:'VERTICAL'});
 assert.equal(d.barns[0].mapX,35);assert.equal(d.barns[0].mapY,45);assert.equal(d.barns[0].mapOrientation,'VERTICAL');
 d=apply(d,'barn.save',{...d.barns[0]});
 assert.equal(d.barns[0].mapOrientation,'VERTICAL');
 d=apply(d,'map.pin',{id:'barn',x:35,y:45,orientation:'HORIZONTAL'});
 assert.equal(d.barns[0].mapOrientation,'HORIZONTAL');
});

test('legacy flocks receive stable male or female classifications without changing other fields',()=>{
 let d=fixture(),name=d.flocks[0].name,quantity=d.flocks[0].quantity;delete d.flocks[0].sex;
 d=apply(d,'map.pin',{id:'barn',x:25,y:30,orientation:'HORIZONTAL'});
 assert.ok(['MALE','FEMALE'].includes(d.flocks[0].sex));assert.equal(d.flocks[0].name,name);assert.equal(d.flocks[0].quantity,quantity);
});
