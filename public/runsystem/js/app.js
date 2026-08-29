document.querySelectorAll('[data-empty-link="true"]').forEach(function(link){
  link.addEventListener('click',function(event){event.preventDefault();});
});
var userAgent=navigator.userAgent||'';
var platform=/android/i.test(userAgent)?'android':/iphone|ipad|ipod/i.test(userAgent)?'ios':null;
if(platform){
  var button=document.querySelector('[data-platform="'+platform+'"]');
  var list=document.querySelector('.buttons');
  if(button&&list){list.prepend(button);var badge=button.querySelector('.recommended');if(badge)badge.hidden=false;}
}