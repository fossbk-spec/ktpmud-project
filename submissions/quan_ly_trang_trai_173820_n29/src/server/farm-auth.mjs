import {createFarm,FarmError,textValue} from '../farm/model.mjs';
import {hashPassword,digest,sessionActor,sessionToken} from './worker-auth.mjs';

export async function resolveFarmIdentity(db,request){
 const token=sessionToken(request);
 if(token)return sessionActor(db,token);
 return null;
}

export function loginRateKey(request){
 // Cloudflare supplies the connection IP; never use a client-supplied farm/user ID as authority.
 return request.headers.get('cf-connecting-ip')||'public-login';
}

export async function registerFarm(db,p,visitorKey){
 const farmCode=textValue(p.farmCode,'Mã trang trại',40).toUpperCase();
 const username=textValue(p.username,'Tên đăng nhập',40).toLowerCase();
 if(!/^[A-Z0-9_-]{3,40}$/.test(farmCode))throw new FarmError('Mã trang trại dùng 3–40 chữ, số, gạch ngang hoặc gạch dưới.');
 if(!/^[a-z0-9_.-]{3,40}$/.test(username))throw new FarmError('Tên đăng nhập dùng 3–40 chữ, số, gạch ngang, gạch dưới hoặc dấu chấm.');
 const fullName=textValue(p.fullName,'Họ tên',100),farmName=textValue(p.farmName,'Tên trang trại',100);
 const key=await digest('register|'+visitorKey),now=Date.now();
 await db.prepare('INSERT INTO auth_attempts(attempt_key,failures,reset_at) VALUES (?,1,?) ON CONFLICT(attempt_key) DO UPDATE SET failures=CASE WHEN auth_attempts.reset_at>? THEN auth_attempts.failures+1 ELSE 1 END,reset_at=CASE WHEN auth_attempts.reset_at>? THEN auth_attempts.reset_at ELSE excluded.reset_at END').bind(key,now+3600000,now,now).run();
 const attempt=await db.prepare('SELECT failures FROM auth_attempts WHERE attempt_key=?').bind(key).first();
 if(attempt.failures>10)throw new FarmError('Đã tạo hoặc thử đăng ký quá nhiều lần. Hãy thử lại sau một giờ.',429);
 if(await db.prepare('SELECT farm_id FROM farm_access_codes WHERE farm_code=?').bind(farmCode).first())throw new FarmError('Mã trang trại đã tồn tại. Hãy chọn mã khác.',409);
 const passwordHash=await hashPassword(p.password),farmId='account:'+crypto.randomUUID(),id=crypto.randomUUID();
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
 const data=createFarm({farmName,farmCode,fullName,sample:false});
 try{
  await db.batch([
   db.prepare('INSERT INTO farm_access_codes(farm_code,farm_id) VALUES (?,?)').bind(farmCode,farmId),
   db.prepare('INSERT INTO farm_documents(farm_id,payload,revision,updated_at) VALUES (?,?,1,?)').bind(farmId,JSON.stringify(data),new Date().toISOString()),
   db.prepare('INSERT INTO auth_users(id,farm_id,username,password_hash,full_name,role,worker_id) VALUES (?,?,?,?,?,?,?)').bind(id,farmId,username,passwordHash,fullName,'FARM_OWNER',null),
   db.prepare('INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await digest(token),id,now+86400000)
  ]);
 }catch(e){
  if(await db.prepare('SELECT farm_id FROM farm_access_codes WHERE farm_code=?').bind(farmCode).first())throw new FarmError('Mã trang trại đã tồn tại. Hãy chọn mã khác.',409);
  throw e;
 }
 return token;
}
