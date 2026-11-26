import {env} from 'cloudflare:workers';
import {FarmError} from '../../../farm/model.mjs';
import {updateFarm} from '../../../farm/service.mjs';
import {readBody,responseError,noStore} from '../../../server/request';
import {canEditSample,SAMPLE_FARM_ID} from '../../../server/sample-auth.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const db=env.DB;if(!db)throw new FarmError('Chưa cấu hình cơ sở dữ liệu mẫu.',503);
 if(!await canEditSample(request,env.SAMPLE_EDITOR_CODE||'farm29'))throw new FarmError('Vui lòng nhập lại mã chỉnh sửa dữ liệu mẫu.',401);
 const body=await readBody(request),actor={id:'sample-editor',farmId:SAMPLE_FARM_ID,role:'FARM_OWNER',workerId:'',name:'Người cập nhật dữ liệu mẫu',authMethod:'sample-editor'};
 const result=await updateFarm(db,SAMPLE_FARM_ID,body,actor);
 return Response.json({...result,mode:'sample-editor',actor},{headers:noStore});
}catch(e){return responseError(e)}}
