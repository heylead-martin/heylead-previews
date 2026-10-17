for(const form of document.querySelectorAll('[data-quote-start]')){
 const input=form.querySelector('[data-quote-job]'),area=form.querySelector('[data-job-area]');
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!input.value.trim()){input.setCustomValidity('Describe the job you need help with.');input.reportValidity();return;}
  const params=new URLSearchParams({job:input.value.trim().slice(0,1200),area:area.value,contact:'1'});
  location.href='/matches/#'+params.toString();
 });
 input.addEventListener('input',()=>input.setCustomValidity(''));
 form.querySelector('fieldset').disabled=false;
}

const disclosure=document.querySelector('.quote-rail-disclosure');
if(disclosure){
 const compact=matchMedia('(max-width:1199px)');
 const resize=()=>{disclosure.open=!compact.matches;};resize();compact.addEventListener('change',resize);
}
