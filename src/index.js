const PAGE = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>رفع الصور إلى ImgBB</title>
<style>
*{box-sizing:border-box}body{font-family:system-ui,Arial;background:#f4f6fb;margin:0;padding:24px;color:#172033}
main{max-width:520px;margin:8vh auto;background:white;padding:24px;border-radius:18px;box-shadow:0 8px 30px #18294b12}
h1{font-size:24px;margin-top:0}p{color:#596579;line-height:1.7}
input,button{width:100%;padding:14px;margin:10px 0;border-radius:10px;font-size:16px}
input{border:1px solid #ccd3df}button{border:0;background:#2563eb;color:white;font-weight:700}
button:disabled{opacity:.6}#result{overflow-wrap:anywhere;line-height:1.8;margin-top:16px}
a{color:#1457c5}small{color:#667085}
</style></head>
<body><main>
<h1>📷 رفع صورة إلى ImgBB</h1>
<p>اختار صورة من موبايلك، واضغط رفع. هتاخد الرابط المباشر للصورة.</p>
<form id="form"><input id="file" type="file" accept="image/*" required>
<button id="btn" type="submit">رفع الصورة</button></form>
<div id="result" role="status"></div>
<small>الصورة تُرسل إلى ImgBB عبر خادم آمن. لا تضع مفتاح API هنا.</small>
</main>
<script>
const form=document.getElementById('form'),file=document.getElementById('file'),btn=document.getElementById('btn'),result=document.getElementById('result');
form.addEventListener('submit',async e=>{
 e.preventDefault(); if(!file.files[0])return;
 btn.disabled=true;btn.textContent='جاري الرفع...';result.textContent='';
 try{
  const data=new FormData();data.append('image',file.files[0]);
  const res=await fetch('/upload',{method:'POST',body:data});
  const out=await res.json();if(!res.ok)throw new Error(out.error||'فشل الرفع');
  result.innerHTML='تم الرفع بنجاح ✅<br>الرابط المباشر: <a target="_blank" rel="noopener" href="'+out.url+'">'+out.url+'</a><br><button type="button" id="copy">نسخ الرابط</button>';
  document.getElementById('copy').onclick=()=>navigator.clipboard.writeText(out.url);
 }catch(err){result.textContent='حصل خطأ: '+err.message}
 finally{btn.disabled=false;btn.textContent='رفع الصورة'}
});
</script></body></html>`;

export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/") {
   return new Response(PAGE, {headers:{"content-type":"text/html; charset=utf-8","x-content-type-options":"nosniff"}});
  }
  if (request.method === "POST" && url.pathname === "/upload") {
   if (!env.IMGBB_API_KEY) return Response.json({error:"لم يتم إعداد مفتاح ImgBB على الخادم بعد."},{status:503});
   const type = request.headers.get("content-type") || "";
   if (!type.includes("multipart/form-data")) return Response.json({error:"صيغة الطلب غير صحيحة."},{status:415});
   let form;
   try { form = await request.formData(); } catch { return Response.json({error:"تعذر قراءة الصورة."},{status:400}); }
   const image = form.get("image");
   if (!(image instanceof File) || !image.size) return Response.json({error:"اختار صورة أولاً."},{status:400});
   if (image.size > 32 * 1024 * 1024) return Response.json({error:"حجم الصورة أكبر من 32 ميجابايت."},{status:413});
   const payload = new FormData();
   payload.set("key", env.IMGBB_API_KEY);
   payload.set("image", image, image.name || "upload");
   let upstream;
   try { upstream = await fetch("https://api.imgbb.com/1/upload",{method:"POST",body:payload}); }
   catch { return Response.json({error:"تعذر الاتصال بخدمة ImgBB."},{status:502}); }
   const result = await upstream.json().catch(()=>null);
   if (!upstream.ok || !result?.success) return Response.json({error:"ImgBB رفض عملية الرفع.",details:result?.error?.message || "Unknown error"},{status:502});
   return Response.json({success:true,url:result.data.url,display_url:result.data.display_url,viewer_url:result.data.url_viewer});
  }
  return new Response("Not found",{status:404});
 }
};