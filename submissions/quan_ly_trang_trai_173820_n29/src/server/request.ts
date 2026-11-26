import {FarmError} from '../farm/model.mjs';
export async function readBody(request:Request){
 if(request.headers.get('sec-fetch-site')==='cross-site')throw new FarmError('Nguồn yêu cầu không hợp lệ.',403);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new FarmError('Nguồn yêu cầu không hợp lệ.',403);
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new FarmError('Yêu cầu phải dùng JSON.',415);
 const raw=await request.text();if(raw.length>8e6)throw new FarmError('Dữ liệu quá lớn.',413);
 try{return JSON.parse(raw)}catch{throw new FarmError('Dữ liệu gửi lên không hợp lệ.')}
}
export function responseError(e:any){const status=e.status||500;return Response.json({message:status<500?e.message:'Không xử lý được yêu cầu. Hãy thử lại.',mode:'hosted'},{status,headers:{'Cache-Control':'no-store'}})}
export const noStore={'Cache-Control':'no-store'};
