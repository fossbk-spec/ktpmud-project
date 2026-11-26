import {env} from 'cloudflare:workers';
import {registerFarm,loginRateKey} from '../../../server/farm-auth.mjs';
import {cookie} from '../../../server/worker-auth.mjs';
import {readBody,responseError,noStore} from '../../../server/request';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{const body=await readBody(request);const token=await registerFarm(env.DB,body,loginRateKey(request));return Response.json({message:'Đã tạo trang trại và tài khoản chủ trại.'},{status:201,headers:{...noStore,'Set-Cookie':cookie(token,!import.meta.env.DEV)}})}catch(e){return responseError(e)}}
