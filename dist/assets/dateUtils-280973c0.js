const g=o=>{const t=new Date,e=new Date(o);let a=t.getFullYear()-e.getFullYear();const n=t.getMonth()-e.getMonth();return(n<0||n===0&&t.getDate()<e.getDate())&&a--,Math.max(0,a)};export{g as c};
