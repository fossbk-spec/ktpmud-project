import {feedFields,healthSupply,useFeedStock,useHealthStock} from './supplies.mjs';
import {FarmError,today} from './model.mjs';
import {workerDailyWage} from './finance.mjs';
const fail=m=>{throw new FarmError(m)};
const find=(d,k,id)=>{const r=d[k].find(r=>r.id===id);if(!r)fail('Không tìm thấy bản ghi.');return r};
const n=(v,min=0,max=1e9)=>{const x=Number(v);if(v===''||!Number.isFinite(x)||x<min||x>max)fail('Số liệu không hợp lệ.');return x};
const validDate=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v||v>today())fail('Ngày không hợp lệ.');return v};
const clean=v=>String(v||'').trim().slice(0,1000);
export function extraOperation(d,type,p,a){
 const owner=a.role==='FARM_OWNER';
 if(type==='map.save'){if(!owner)fail('Chỉ chủ được sửa sơ đồ.');if(p.image&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p.image))fail('Ảnh sơ đồ không hợp lệ.');if((p.image||'').length>650000)fail('Ảnh sơ đồ quá lớn.');d.map={...(d.map||{}),image:p.image||''};return 'Đã lưu ảnh sơ đồ.'}
 if(type==='map.pin'){if(!owner)fail('Chỉ chủ được ghim vị trí.');const b=find(d,'barns',p.id);b.mapX=p.x==null?null:n(p.x);b.mapY=p.y==null?null:n(p.y);if(b.mapX>100||b.mapY>100)fail('Vị trí nằm ngoài sơ đồ.');if(p.orientation!=null){const orientation=String(p.orientation).toUpperCase();if(!['HORIZONTAL','VERTICAL'].includes(orientation))fail('Hướng ghim không hợp lệ.');b.mapOrientation=orientation}else b.mapOrientation||='HORIZONTAL';return 'Đã cập nhật vị trí chuồng.'}
 if(type==='worker.archive'){const w=find(d,'workers',p.id);w.active=false;w.archived=true;w.flockIds=[];return 'Đã lưu trữ hồ sơ nhân viên và khóa truy cập.'}
 if(type==='inventory.delete'){find(d,'inventory',p.id);if((d.stockMoves||[]).some(r=>r.itemId===p.id)||d.feeding.some(r=>r.itemId===p.id||r.medicineId===p.id)||d.health.some(r=>r.supplyId===p.id))fail('Vật tư đã có nhật ký; giữ lại để đối chiếu lịch sử.');d.inventory=d.inventory.filter(r=>r.id!==p.id);return 'Đã xóa vật tư chưa có nhật ký.'}
 if(type==='flock.delete'){find(d,'flocks',p.id);if(['feeding','health','finance'].some(k=>d[k].some(r=>r.flockId===p.id))||d.flocks.some(f=>f.parentId===p.id))fail('Đàn đã có lịch sử. Xóa các bản ghi liên quan có kiểm soát trước khi xóa đàn.');d.flocks=d.flocks.filter(r=>r.id!==p.id);d.tasks=d.tasks.filter(r=>r.flockId!==p.id);for(const w of d.workers)w.flockIds=w.flockIds.filter(id=>id!==p.id);return 'Đã xóa đàn chưa có lịch sử.'}
 if(['breed.delete','vaccineTemplate.delete'].includes(type)){const k=type==='breed.delete'?'breeds':'vaccineTemplates',r=find(d,k,p.id);if(k==='breeds'&&d.flocks.some(f=>f.breed===r.name))fail('Giống đang được sử dụng trong lịch sử đàn.');d[k]=d[k].filter(r=>r.id!==p.id);return 'Đã xóa mục cấu hình.'}
 if(type==='health.treat'){
  const r=find(d,'health',p.id),f=find(d,'flocks',r.flockId);
  if(f.status!=='RAISING'||r.status==='REJECTED')fail('Không thể ghi xử lý cho nhật ký này.');
  const treatment=clean(p.treatment);if(!treatment)fail('Nhập biện pháp đã xử lý.');
  const supply=healthSupply(d,p);if(r.status==='APPROVED'){useHealthStock(d,r,1,a.name);const next={...r,...supply};delete next.supplyUnitPrice;useHealthStock(d,next,-1,a.name);supply.supplyUnitPrice=next.supplyUnitPrice;}
  Object.assign(r,supply,{treatment,treatedBy:a.name,treatedAt:new Date().toISOString()});
  return 'Đã ghi biện pháp xử lý của chủ trại.';
 }
 const parts=type.split('.'),kind=parts[0],operation=parts[1];
 if(!['feeding','health','attendance'].includes(kind)||!['update','delete'].includes(operation))return null;
 const row=find(d,kind,p.id);
 if(!owner&&kind!=='attendance'&&!find(d,'workers',a.workerId).flockIds.includes(row.flockId))throw new FarmError('Bạn không còn được phân công đàn này.',403);
 if(!owner&&(row.workerId!==a.workerId||row.status!=='PENDING'))throw new FarmError('Chỉ sửa/xóa báo cáo chờ duyệt do chính bạn tạo.',403);
 if(kind==='attendance'){
  if(operation==='delete')d.attendance=d.attendance.filter(x=>x.id!==row.id);
  else{if(!['FULL','HALF','OFF'].includes(p.shift))fail('Ngày công không hợp lệ.');row.shift=p.shift;row.note=clean(p.note);if(row.dailyWage==null)row.dailyWage=workerDailyWage(find(d,'workers',row.workerId),row.date);if(owner)row.status='APPROVED';}
  return operation==='delete'?'Đã xóa bản chấm công.':'Đã sửa chấm công.';
 }
 const f=find(d,'flocks',row.flockId);if(f.status!=='RAISING')fail('Đàn đã xuất, không sửa nhật ký của lứa đã kết thúc.');
 if(operation==='delete'&&row.status==='APPROVED'){
  if(kind==='feeding')useFeedStock(d,row,1,a.name);
  else{const b=find(d,'barns',f.barnId),used=d.flocks.filter(x=>x.status==='RAISING'&&x.barnId===b.id).reduce((s,x)=>s+x.quantity,0);if(used+row.dead>b.capacity)fail('Hoàn lại hao hụt sẽ vượt sức chứa chuồng.');f.quantity+=row.dead;f.deadTotal-=row.dead;useHealthStock(d,row,1,a.name);}
 }
 if(operation==='delete'){d[kind]=d[kind].filter(r=>r.id!==row.id);if(kind==='feeding'){const latest=d.feeding.filter(r=>r.flockId===f.id&&r.status==='APPROVED'&&r.weight>0).sort((x,y)=>y.date.localeCompare(x.date))[0];if(latest)f.avgWeight=latest.weight;}return 'Đã xóa nhật ký và hoàn lại số liệu liên quan.'}
 const dt=validDate(p.date);if(dt<f.importDate)fail('Ngày nhật ký phải sau ngày nhập đàn.');
 if(kind==='feeding'){
  const fields=feedFields(d,p),weight=n(p.weight||0,0,20);
  if(row.status==='APPROVED'){useFeedStock(d,row,1,a.name);const next={...row,...fields,itemId:p.itemId,date:dt};if(row.itemId!==p.itemId)delete next.feedUnitPrice;if(row.medicineId!==fields.medicineId)delete next.medicineUnitPrice;useFeedStock(d,next,-1,a.name);Object.assign(fields,{feedUnitPrice:next.feedUnitPrice,medicineUnitPrice:next.medicineUnitPrice});if(weight>0)f.avgWeight=weight;}
  Object.assign(row,{date:dt,itemId:p.itemId,...fields,weight,note:clean(p.note)});
 }else{
  const sick=n(p.sick||0),dead=n(p.dead||0);if(!Number.isInteger(sick)||!Number.isInteger(dead)||!clean(p.condition))fail('Số gà phải là số nguyên và cần nhập tình trạng.');
  const available=f.quantity+(row.status==='APPROVED'?row.dead:0);if(sick+dead>available)fail('Số gà ốm/chết vượt số gà hiện có.');
  if(row.status==='APPROVED'){const restored=row.dead-dead,b=find(d,'barns',f.barnId),used=d.flocks.filter(x=>x.status==='RAISING'&&x.barnId===b.id).reduce((s,x)=>s+x.quantity,0);if(used+restored>b.capacity)fail('Điều chỉnh hao hụt sẽ vượt sức chứa chuồng.');f.quantity+=restored;f.deadTotal-=restored;}
  const supply=healthSupply(d,p);if(row.status==='APPROVED'){useHealthStock(d,row,1,a.name);const next={...row,...supply,date:dt};if(row.supplyId!==supply.supplyId)delete next.supplyUnitPrice;useHealthStock(d,next,-1,a.name);supply.supplyUnitPrice=next.supplyUnitPrice;}
  Object.assign(row,{date:dt,sick,dead,...supply,condition:clean(p.condition),disease:clean(p.disease).slice(0,150),treatment:clean(p.treatment),note:clean(p.note)});
 }
 row.modifiedBy=a.name;row.modifiedAt=new Date().toISOString();return 'Đã sửa nhật ký và cân đối lại số liệu.';
}
