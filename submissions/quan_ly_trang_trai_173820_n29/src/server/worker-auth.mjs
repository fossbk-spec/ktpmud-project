import {FarmError} from '../farm/model.mjs';
import {loadFarm} from '../farm/service.mjs';
const encode=s=>new TextEncoder().encode(s);
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const unhex=s=>new Uint8Array(s.match(/.{2}/g).map(x=>parseInt(x,16)));
export const digest=async s=>hex(await crypto.subtle.digest('SHA-256',encode(s)));
export async function hashPassword(password){
 if(typeof password!=='string'||password.length<8||password.length>128)throw new FarmError('Mật khẩu cần từ 8 đến 128 ký tự.');
 const salt=crypto.getRandomValues(new Uint8Array(16)),key=await crypto.subtle.importKey('raw',encode(password),'PBKDF2',false,['deriveBits']);
 const hash=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:100000},key,256);
 return 'pbkdf2:100000:'+hex(salt)+':'+hex(hash);
}
export async function verifyPassword(password,stored){
 if(typeof password!=='string'||password.length>128||!/^pbkdf2:100000:[a-f0-9]{32}:[a-f0-9]{64}$/.test(stored||''))return false;
 const [,iterations,salt,expected]=stored.split(':'),key=await crypto.subtle.importKey('raw',encode(password),'PBKDF2',false,['deriveBits']);
 const actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unhex(salt),iterations:Number(iterations)},key,256)),want=unhex(expected);
 let different=0;for(let i=0;i<want.length;i++)different|=actual[i]^want[i];return different===0;
}
export const sessionToken=request=>(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('farm_worker_session='))?.slice(20);
export async function sessionActor(db,token){
 if(!token)return null;
 const user=await db.prepare('SELECT u.* FROM auth_sessions s JOIN auth_users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token),Date.now()).first();
 if(!user||!['WORKER','FARM_OWNER'].includes(user.role))throw new FarmError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',401);
 if(user.role==='FARM_OWNER')return{id:user.id,farmId:user.farm_id,role:'FARM_OWNER',workerId:'',name:user.full_name,authMethod:'password'};
 const {data}=await loadFarm(db,user.farm_id),worker=data.workers.find(w=>w.id===user.worker_id);
 if(!worker?.active)throw new FarmError('Tài khoản nhân viên đã bị khóa. Liên hệ chủ trang trại.',401);
 return{id:user.id,farmId:user.farm_id,role:'WORKER',workerId:worker.id,name:worker.name,authMethod:'password'};
}
export async function accessCode(db,farmId){
 let row=await db.prepare('SELECT farm_code FROM farm_access_codes WHERE farm_id=?').bind(farmId).first();
 if(row)return row.farm_code;
 const code='HH-'+(await digest(farmId)).slice(0,12).toUpperCase();
 await db.prepare('INSERT INTO farm_access_codes(farm_code,farm_id) VALUES (?,?) ON CONFLICT(farm_id) DO NOTHING').bind(code,farmId).run();
 return(await db.prepare('SELECT farm_code FROM farm_access_codes WHERE farm_id=?').bind(farmId).first()).farm_code;
}
export async function loginAccount(db,p,visitorKey){
 const code=String(p.farmCode||'').trim().toUpperCase(),username=String(p.username||'').trim().toLowerCase();
 if(!/^[A-Z0-9_-]{3,40}$/.test(code)||!/^[a-z0-9_.-]{3,40}$/.test(username))throw new FarmError('Kiểm tra lại mã trang trại và tên đăng nhập.');
 const key=await digest(visitorKey+'|'+code+'|'+username),now=Date.now(),attempt=await db.prepare('SELECT failures,reset_at FROM auth_attempts WHERE attempt_key=?').bind(key).first();
 if(attempt&&attempt.reset_at>now&&attempt.failures>=10)throw new FarmError('Đã thử quá nhiều lần. Hãy thử lại sau 15 phút.',429);
 const farm=await db.prepare('SELECT farm_id FROM farm_access_codes WHERE farm_code=?').bind(code).first();
 const user=farm?await db.prepare('SELECT * FROM auth_users WHERE farm_id=? AND username=?').bind(farm.farm_id,username).first():null;
 if(!user||!await verifyPassword(p.password,user.password_hash)){
  if(attempt&&attempt.reset_at>now)await db.prepare('UPDATE auth_attempts SET failures=failures+1 WHERE attempt_key=?').bind(key).run();
  else await db.batch([db.prepare('DELETE FROM auth_attempts WHERE attempt_key=?').bind(key),db.prepare('INSERT INTO auth_attempts(attempt_key,failures,reset_at) VALUES (?,?,?)').bind(key,1,now+900000)]);
  throw new FarmError('Mã trang trại, tài khoản hoặc mật khẩu chưa đúng.',401);
 }
 if(p.expectedRole&&p.expectedRole!==user.role)throw new FarmError('Tài khoản không thuộc vai trò đã chọn. Hãy chọn lại Chủ trang trại hoặc Nhân viên.',401);
 if(user.role==='WORKER'){const {data}=await loadFarm(db,user.farm_id);if(!data.workers.some(w=>w.id===user.worker_id&&w.active))throw new FarmError('Tài khoản đã bị khóa. Liên hệ chủ trang trại.',403);}
 else if(user.role!=='FARM_OWNER')throw new FarmError('Tài khoản không hợp lệ.',401);
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));
 await db.batch([db.prepare('DELETE FROM auth_attempts WHERE attempt_key=?').bind(key),db.prepare('DELETE FROM auth_sessions WHERE expires_at<?').bind(now),db.prepare('INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await digest(token),user.id,now+86400000)]);
 return token;
}
export const loginWorker=(db,p,visitorKey)=>loginAccount(db,{...p,expectedRole:'WORKER'},visitorKey);
export const cookie=(token,secure=true)=>`farm_worker_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token?86400:0}${secure?'; Secure':''}`;
export async function logoutWorker(db,request){const token=sessionToken(request);if(token)await db.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await digest(token)).run()}
export async function changeWorkerPassword(db,actor,p){
 if(!actor||!['WORKER','FARM_OWNER'].includes(actor.role)||actor.authMethod==='chatgpt')throw new FarmError('Đăng nhập bằng tài khoản trang trại để đổi mật khẩu.',403);
 const user=await db.prepare('SELECT password_hash FROM auth_users WHERE id=?').bind(actor.id).first();
 if(!await verifyPassword(p.currentPassword,user?.password_hash))throw new FarmError('Mật khẩu hiện tại chưa đúng.');
 const hash=await hashPassword(p.newPassword),token=hex(crypto.getRandomValues(new Uint8Array(32)));
 await db.batch([db.prepare('UPDATE auth_users SET password_hash=? WHERE id=?').bind(hash,actor.id),db.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(actor.id),db.prepare('INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await digest(token),actor.id,Date.now()+86400000)]);
 return token;
}
