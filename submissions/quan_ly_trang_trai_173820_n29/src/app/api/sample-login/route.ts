import {env} from 'cloudflare:workers';
import {FarmError} from '../../../farm/model.mjs';
import {readBody,responseError,noStore} from '../../../server/request';
import {sampleCookie,sampleToken} from '../../../server/sample-auth.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const body=await readBody(request),expected=env.SAMPLE_EDITOR_CODE||'farm29';
 if(String(body.code||'')!==expected)throw new FarmError('Mã chỉnh sửa dữ liệu mẫu chưa đúng.',401);
 return Response.json({message:'Đã mở quyền chỉnh sửa dữ liệu mẫu.'},{headers:{...noStore,'Set-Cookie':sampleCookie(await sampleToken(expected),!import.meta.env.DEV)}});
}catch(e){return responseError(e)}}
