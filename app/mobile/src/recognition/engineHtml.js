// Only landmark coordinates cross back to React Native. Camera images never go to the API.
export const engineHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script type="module">
const send = message => window.ReactNativeWebView.postMessage(JSON.stringify(message));
try {
 const {FilesetResolver,HandLandmarker}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
 const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
 const detector=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numHands:2});
 window.processFrame=async(base64,id)=>{
  try {
   const img=new Image(); img.src='data:image/jpeg;base64,'+base64; await img.decode();
   const result=detector.detect(img); send({type:'pose',id,hands:result.landmarks}); img.src='';
  } catch(error){send({type:'frameError',id,message:String(error.message)});}
 };
 send({type:'ready'});
} catch(error){send({type:'error',message:'Não foi possível carregar o detector. Confira sua conexão e tente novamente.'});}
</script></body></html>`;
