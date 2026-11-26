import {env} from 'cloudflare:workers';
import {loginAccount,cookie} from '../../../server/worker-auth.mjs';
import {loginRateKey} from '../../../server/farm-auth.mjs';
import {readBody,responseError,noStore} from '../../../server/request';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{const body=await readBody(request);const token=await loginAccount(env.DB,body,loginRateKey(request));return Response.json({message:'Đăng nhập thành công.'},{headers:{...noStore,'Set-Cookie':cookie(token,!import.meta.env.DEV)}})}catch(e){return responseError(e)}}
