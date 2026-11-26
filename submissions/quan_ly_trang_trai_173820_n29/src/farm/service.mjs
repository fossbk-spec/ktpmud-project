import { createFarm, mutateFarm, visibleData, FarmError } from './model.mjs';
import {normalizeFlockSexes} from './flocks.mjs';

export async function loadFarm(db, farmId, options={}) {
 let row=await db.prepare('SELECT payload, revision FROM farm_documents WHERE farm_id = ?').bind(farmId).first();
 if(!row&&options.create) {
  const data=createFarm(options.create);
  await db.prepare('INSERT INTO farm_documents (farm_id,payload,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(farm_id) DO NOTHING').bind(farmId,JSON.stringify(data),new Date().toISOString()).run();
  row=await db.prepare('SELECT payload, revision FROM farm_documents WHERE farm_id = ?').bind(farmId).first();
 }
 if(!row) throw new FarmError('Không tìm thấy trang trại.',404);
 return {data:normalizeFlockSexes(JSON.parse(row.payload)),revision:Number(row.revision)};
}

export async function updateFarm(db,farmId,requestBody,actor) {
 const current=await loadFarm(db,farmId);
 if(!Number.isInteger(requestBody.revision)||requestBody.revision!==current.revision)throw new FarmError('Dữ liệu vừa được cập nhật ở nơi khác. Hãy tải lại trang rồi thử lại.',409);
 // Username changes must use the atomic profile + login transaction.
 if(actor.role==='FARM_OWNER'&&requestBody.action?.type==='worker.save'){
  const p=requestBody.action.payload||{},old=current.data.workers.find(w=>w.id===p.id);
  if(old&&String(p.username||'').trim().toLowerCase()!==old.username)throw new FarmError('Đổi tên đăng nhập tại Sửa / Phân công để cập nhật cả tài khoản.');
 }
 const next=mutateFarm(current.data,requestBody.action,actor);
 const payload=JSON.stringify(next.data);
 if(new TextEncoder().encode(payload).length>1800000)throw new FarmError('Dữ liệu trang trại đã đạt giới hạn 1,8 MB. Hãy xuất báo cáo và lưu trữ lứa cũ trước khi nhập thêm.',413);
 const result=await db.prepare('UPDATE farm_documents SET payload = ?, revision = revision + 1, updated_at = ? WHERE farm_id = ? AND revision = ?').bind(payload,new Date().toISOString(),farmId,current.revision).run();
 if(Number(result.meta?.changes)!==1)throw new FarmError('Có người vừa lưu dữ liệu. Hãy tải lại trang rồi thử lại.',409);
 return{...next,data:visibleData(next.data,actor),revision:current.revision+1};
}
