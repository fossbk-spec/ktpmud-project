import {env} from 'cloudflare:workers';
import {loadFarm} from '../../../farm/service.mjs';
import {FarmError} from '../../../farm/model.mjs';
import {SAMPLE_FARM_ID} from '../../../server/sample-auth.mjs';
import {responseError,noStore} from '../../../server/request';
export const dynamic='force-dynamic';
export async function GET(){try{
 const db=env.DB;if(!db)throw new FarmError('Chưa cấu hình cơ sở dữ liệu mẫu.',503);
 const state=await loadFarm(db,SAMPLE_FARM_ID,{create:{farmName:'Trang trại mẫu HaHa',farmCode:'DEMO',fullName:'Người quản lý dữ liệu mẫu',sample:true}});
 return Response.json({...state,mode:'demo'},{headers:noStore});
}catch(e){return responseError(e)}}
