import {FarmError,mutateFarm,visibleData} from './model.mjs';
import {loadFarm} from './service.mjs';

export async function accountState(db,farmId,state,actor){
 if(actor.role!=='FARM_OWNER')return state;
 const {results}=await db.prepare('SELECT worker_id FROM auth_users WHERE farm_id=? AND role=?').bind(farmId,'WORKER').all();
 const ids=new Set(results.map(r=>r.worker_id));
 return {...state,data:{...state.data,workers:state.data.workers.map(w=>({...w,accountReady:ids.has(w.id)}))}};
}

// A profile and its login are committed together. Every following statement is
// conditional on the exact snapshot written by the first compare-and-swap.
export async function saveStaff(db,farmId,body,actor,hashPassword){
 if(actor.role!=='FARM_OWNER')throw new FarmError('Chỉ chủ trang trại được quản lý tài khoản nhân viên.',403);
 const current=await loadFarm(db,farmId);
 if(body.revision!==current.revision)throw new FarmError('Dữ liệu vừa thay đổi. Hãy tải lại rồi thử lại.',409);
 const p=body.worker||{},old=p.id?current.data.workers.find(w=>w.id===p.id):null;
 const next=mutateFarm(current.data,{type:'worker.save',payload:p},actor);
 const username=String(p.username||'').trim().toLowerCase();
 const worker=next.data.workers.find(w=>old?w.id===old.id:w.username===username);
 if(!worker)throw new FarmError('Không tìm thấy hồ sơ nhân viên.',404);
 // A login belongs to a stable employee ID, not to the editable username.
 const existing=old?await db.prepare('SELECT id,username FROM auth_users WHERE farm_id=? AND worker_id=? AND role=?').bind(farmId,old.id,'WORKER').first():null;
 const used=await db.prepare('SELECT id FROM auth_users WHERE farm_id=? AND username=?').bind(farmId,username).first();
 if(used&&used.id!==existing?.id)throw new FarmError('Tên đăng nhập này đã được tài khoản khác sử dụng.',409);
 if(!existing&&!p.password)throw new FarmError('Nhập mật khẩu để tạo tài khoản nhân viên.');
 const hash=p.password?await hashPassword(p.password):null;
 const renamed=!!existing&&existing.username!==username;
 const payload=JSON.stringify(next.data),revision=current.revision+1;
 if(new TextEncoder().encode(payload).length>1800000)throw new FarmError('Dữ liệu trang trại vượt giới hạn 1,8 MB.',413);
 const statements=[db.prepare('UPDATE farm_documents SET payload=?,revision=revision+1,updated_at=? WHERE farm_id=? AND revision=?').bind(payload,new Date().toISOString(),farmId,current.revision)];
 const condition='EXISTS (SELECT 1 FROM farm_documents WHERE farm_id=? AND revision=? AND payload=?)';
 if(existing){
  statements.push(hash?db.prepare('UPDATE auth_users SET username=?,full_name=?,password_hash=? WHERE id=? AND '+condition).bind(username,worker.name,hash,existing.id,farmId,revision,payload):db.prepare('UPDATE auth_users SET username=?,full_name=? WHERE id=? AND '+condition).bind(username,worker.name,existing.id,farmId,revision,payload));
  if(renamed||hash||!worker.active)statements.push(db.prepare('DELETE FROM auth_sessions WHERE user_id=? AND '+condition).bind(existing.id,farmId,revision,payload));
 }else{
  statements.push(db.prepare('INSERT INTO auth_users(id,farm_id,username,password_hash,full_name,role,worker_id) SELECT ?,?,?,?,?,?,? FROM farm_documents WHERE farm_id=? AND revision=? AND payload=?').bind(crypto.randomUUID(),farmId,username,hash,worker.name,'WORKER',worker.id,farmId,revision,payload));
 }
 const result=await db.batch(statements);
 if(Number(result[0].meta?.changes)!==1)throw new FarmError('Có người vừa cập nhật dữ liệu. Hãy tải lại rồi thử lại.',409);
 return accountState(db,farmId,{data:visibleData(next.data,actor),revision,message:renamed?'Đã đổi tên đăng nhập. Nhân viên đăng nhập lại bằng tên mới.':existing?'Đã cập nhật nhân viên, phân công và tài khoản.':'Đã tạo nhân viên và tài khoản đăng nhập.'},actor);
}
